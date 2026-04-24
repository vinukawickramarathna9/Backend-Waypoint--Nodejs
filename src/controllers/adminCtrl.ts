import { Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { AuthRequest } from '../middlewares/auth';
import { Route } from '../models/Route';
import { User } from '../models/User';
import { registerSchema } from '../utils/validators';

export const createRoute = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
      const { name, stops, distance, status } = req.body;

      if (!name || !stops || !Array.isArray(stops)) {
        res.status(400).json({ success: false, error: { message: "Invalid route payload" } });
        return;
      }

      const formattedStops = stops.map(stop => ({
          name: stop?.name || 'Unknown Stop',
          location: {
            type: 'Point',
            coordinates: [stop?.location?.lng || 0, stop?.location?.lat || 0]
          }
        }));

        const newRoute = await Route.create({
          name,
          distance,
          status: status || 'Active',
          stops: formattedStops,
          schedule: []
        });
    res.status(201).json({
      success: true,
      data: {
        route: {
          id: newRoute._id,
          name: newRoute.name,
          stops: stops
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

export const getRoutes = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const routes = await Route.find().sort({ name: 1 });
    res.status(200).json({ success: true, data: { routes } });
  } catch (error) { next(error); }
};

export const updateRoute = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, stops, distance, status } = req.body;

    const route = await Route.findById(id);
    if (!route) {
      res.status(404).json({ success: false, error: { message: 'Route not found' } });
      return;
    }

    if (name) route.name = name;
    if (distance) route.distance = distance;
    if (status) route.status = status;
    if (stops && Array.isArray(stops)) {
      route.stops = stops.map(stop => ({
          name: stop?.name || 'Unknown Stop',
          location: {
            type: 'Point',
            coordinates: [stop?.location?.lng || 0, stop?.location?.lat || 0]
          }
      }));
    }

    await route.save();

    res.status(200).json({
      success: true,
      message: 'Route updated successfully',
      data: {
        route: {
          id: route._id,
          name: route.name,
          stops: stops || route.stops
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteRoute = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const route = await Route.findById(id);
    if (!route) {
      res.status(404).json({ success: false, error: { message: 'Route not found' } });
      return;
    }

    await Route.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Route deleted successfully',
      data: {}
    });

  } catch (error) {
    next(error);
  }
};

export const createUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsedData = registerSchema.parse(req.body);
    const { name, email, password, role } = parsedData;

    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400).json({ success: false, error: { message: 'User already exists' } });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate Custom ID (P001, D001, A001)
    const prefix = role === 'driver' ? 'D' : role === 'admin' ? 'A' : 'P';      
    const lastUser = await User.findOne({ role }).sort({ createdAt: -1 });      

    let nextNum = 1;
    if (lastUser && lastUser.customId) {
      const match = lastUser.customId.match(/\d+$/);
      if (match) {
        nextNum = parseInt(match[0], 10) + 1;
      }
    }
    const customId = `${prefix}${nextNum.toString().padStart(3, '0')}`;

    const user: any = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'passenger',
      customId
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        user: {
          id: user._id,
          customId: user.customId,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ success: false, error: { message: error.errors[0].message } });
      return;
    }
    next(error);
  }
};

export const getUsers = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Optionally filter by role, e.g. ?role=passenger
    const role = req.query.role as string;
    const filter = role ? { role } : {};
    
    const users = await User.find(filter).select('-password').sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      data: {
        users: users.map(user => ({
          id: user._id,
          customId: user.customId,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};
export const updateUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, email, role, password } = req.body;

    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ success: false, error: { message: 'User not found' } });
      return;
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    
    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: {
        user: {
          id: user._id,
          customId: user.customId,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ success: false, error: { message: 'User not found' } });
      return;
    }

    await User.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
      data: {}
    });

  } catch (error) {
    next(error);
  }
};import { Bus } from '../models/Bus';
import { Trip } from '../models/Trip';
import { Booking } from '../models/Booking';

export const createBus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const bus = await Bus.create(req.body);
    res.status(201).json({ success: true, data: { bus } });
  } catch (error) { next(error); }
};

export const getBuses = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const buses = await Bus.find().sort({ name: 1 });
    res.status(200).json({ success: true, data: { buses } });
  } catch (error) { next(error); }
};

export const updateBus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const bus = await Bus.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ success: true, data: { bus } });
  } catch (error) { next(error); }
};

export const deleteBus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await Bus.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Bus deleted' });
  } catch (error) { next(error); }
};

export const createTrip = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const payload: any = { ...req.body };

    // Auto-resolve routeId from the route name string
    if (payload.route && !payload.routeId) {
      const foundRoute = await Route.findOne({ name: payload.route });
      if (foundRoute) payload.routeId = foundRoute._id;
    }

    const trip = await Trip.create(payload);
    res.status(201).json({ success: true, data: { trip } });
  } catch (error) { next(error); }
};

export const getTrips = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const trips = await Trip.find().populate('routeId').populate('driverId');
    res.status(200).json({ success: true, data: { trips } });
  } catch (error) { next(error); }
};

export const updateTrip = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const payload: any = { ...req.body };

    // Auto-resolve routeId from the route name string if provided
    if (payload.route && !payload.routeId) {
      const foundRoute = await Route.findOne({ name: payload.route });
      if (foundRoute) payload.routeId = foundRoute._id;
    }

    const trip = await Trip.findByIdAndUpdate(req.params.id, payload, { new: true });
    res.status(200).json({ success: true, data: { trip } });
  } catch (error) { next(error); }
};

export const deleteTrip = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await Trip.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Trip deleted' });
  } catch (error) { next(error); }
};

export const createBooking = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const booking = await Booking.create(req.body);
    res.status(201).json({ success: true, data: { booking } });
  } catch (error) { next(error); }
};

export const getBookings = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const bookings = await Booking.find().sort({ date: -1 });
    res.status(200).json({ success: true, data: { bookings } });
  } catch (error) { next(error); }
};

export const updateBooking = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const booking = await Booking.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ success: true, data: { booking } });
  } catch (error) { next(error); }
};

export const deleteBooking = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await Booking.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Booking deleted' });
  } catch (error) { next(error); }
};




