import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { BoardingHistory } from '../models/BoardingHistory';
import { Trip } from '../models/Trip';
import { Booking } from '../models/Booking';

export const getMe = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user;
    
    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
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

export const getHistory = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Populate the route name internally if required by fetching trip info
    const history = await BoardingHistory.find({ passengerId: req.user._id })
      .populate({
        path: 'tripId',
        select: 'routeId',
        populate: {
          path: 'routeId',
          model: 'Route',
          select: 'name'
        }
      })
      .sort('-timestamp');
      
    // Format to match API contracts
    const formattedHistory = history.map((item: any) => ({
      id: item._id,
      routeName: item.tripId?.routeId?.name || 'Unknown Route',
      boardedAtStop: item.boardedAtStop,
      timestamp: item.timestamp
    }));

    res.status(200).json({
      success: true,
      data: {
        history: formattedHistory
      }
    });
  } catch (error) {
    next(error);
  }
};

export const createBooking = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user;
    const { tripId } = req.body;

    if (!tripId) {
      res.status(400).json({ success: false, error: { message: "Trip ID is required" } });
      return;
    }

    const trip = await Trip.findById(tripId);
    if (!trip) {
      res.status(404).json({ success: false, error: { message: "Trip not found" } });
      return;
    }

    const seatLimit = parseInt(trip.seatLimit || '0', 10);
    const boarded = trip.passengersBoarded || 0;
    
    if (seatLimit > 0 && boarded >= seatLimit) {
      res.status(400).json({ success: false, error: { message: "Trip is fully booked" } });
      return;
    }

    // Increment boarded/booked count (reserving the seat)
    trip.passengersBoarded = boarded + 1;
    await trip.save();

    const newBooking = await Booking.create({
      passenger: user._id.toString(), // or user.name
      trip: tripId,
      date: new Date().toISOString(),
      status: 'Confirmed'
    });

    res.status(201).json({
      success: true,
      data: {
        booking: newBooking
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getMyBookings = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user;
    const bookings = await Booking.find({ passenger: user._id.toString() }).sort({ _id: -1 });
    
    // We optionally populate trips but it's a string ID. For full info, we map and query manually or change the schema.
    const tripIds = bookings.map(b => b.trip);
    const trips = await Trip.find({ _id: { $in: tripIds } }).populate('routeId');

    const formattedBookings = bookings.map(b => {
      const trip = trips.find(t => t._id.toString() === b.trip);
      return {
        id: b._id,
        date: b.date,
        status: b.status,
        trip: trip ? {
          id: trip._id,
          time: trip.time || (trip.startTime ? new Date(trip.startTime).toLocaleTimeString() : 'N/A'),
          route: trip.route || trip.name || (trip.routeId ? (trip.routeId as any).name : 'Unknown')
        } : null
      };
    });

    res.status(200).json({
      success: true,
      data: {
        bookings: formattedBookings
      }
    });
  } catch (error) {
    next(error);
  }
};
