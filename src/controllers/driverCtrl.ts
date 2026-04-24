import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { Trip } from '../models/Trip';
import { Route } from '../models/Route';
import { BoardingHistory } from '../models/BoardingHistory';
import { Booking } from '../models/Booking';
import { User } from '../models/User';
import { removeDriverLocation } from './mapCtrl';

// Get assigned trips
export const getAssignedTrips = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const trips = await Trip.find({
      $or: [
        { driverId: req.user._id },
        { driver: req.user.name }
      ],
      status: { $in: ['Scheduled', 'en_route'] }
    })
      .populate('routeId')
      .sort({ startTime: 1, _id: 1 });

    // For legacy trips that have route string but no routeId, resolve it now
    const resolvedTrips = await Promise.all(trips.map(async (trip: any) => {
      const t = trip.toObject();
      if (!t.routeId && t.route) {
        const foundRoute = await Route.findOne({ name: t.route }).select('_id name stops');
        if (foundRoute) {
          t.routeId = foundRoute;
        }
      }
      return t;
    }));

    res.status(200).json({
      success: true,
      data: { trips: resolvedTrips }
    });
  } catch (error) {
    next(error);
  }
};

// Start an existing assigned trip
export const startTrip = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { tripId, location } = req.body;

    if (!tripId || !location || !location.latitude || !location.longitude) {
      res.status(400).json({ success: false, error: { message: "Trip ID and valid location required" } });
      return;
    }

    const trip = await Trip.findById(tripId).populate('routeId');
    if (!trip) {
      res.status(404).json({ success: false, error: { message: "Trip not found" } });
      return;
    }

    const isAssigned = 
      (trip.driverId && trip.driverId.toString() === req.user._id.toString()) ||
      (trip.driver && trip.driver.trim().toLowerCase() === req.user.name.trim().toLowerCase());

    if (!isAssigned) {
      console.log(`[startTrip] Assignment mismatch — trip.driver: "${trip.driver}" | trip.driverId: ${trip.driverId} | req.user: "${req.user.name}" (${req.user._id})`);
      res.status(403).json({ success: false, error: { message: `Trip not assigned to you. Trip driver: "${trip.driver || trip.driverId}", Your name: "${req.user.name}"` } });
      return;
    }

    if (trip.status === 'en_route') {
       res.status(400).json({ success: false, error: { message: "Trip already started" } });
       return;
    }

    // Update trip status
    trip.status = 'en_route';
    trip.startTime = new Date();
    await trip.save();

    // Dynamically import TripHistory to avoid collision if it wasn't used yet
    const TripHistoryModel = (await import('../models/TripHistory')).default;

    // Log to TripHistory
    await TripHistoryModel.create({
      tripId: trip._id as any,
      routeId: (trip.routeId as any)?._id as any,
      busNumber: (trip as any).bus || 'Unknown Bus',
      driverId: req.user._id as any,
      startTime: trip.startTime,
      startLocation: { lat: location.latitude, lng: location.longitude },
      status: 'started'
    });

    res.status(200).json({
      success: true,
      message: "Trip Started",
      data: {
        trip: {
          id: trip._id,
          status: trip.status,
          startTime: trip.startTime
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

// Update Trip Progress (Stop Index)
export const updateProgress = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tripId = req.params.id;
    const { currentStopIndex } = req.body;

    if (currentStopIndex === undefined) {
      res.status(400).json({ success: false, error: { message: "currentStopIndex required" } });       
      return;
    }

    const filter: any = {
      _id: tripId,
      $or: [{ driverId: req.user._id }, { driver: req.user.name }]
    };

    const trip = await Trip.findOneAndUpdate(
      filter,
      { currentStopIndex: currentStopIndex },
      { new: true }
    );

    if (!trip) {
      res.status(404).json({ success: false, error: { message: "Trip not found or unauthorized driver" } });       
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        trip: {
          id: trip._id,
          currentStopIndex: trip.currentStopIndex,
          status: trip.status
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// End Trip
export const endTrip = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => { 
  try {
    const tripId = req.params.id;
    const { location } = req.body;

    const filter: any = {
      _id: tripId,
      $or: [{ driverId: req.user._id }, { driver: req.user.name }]
    };

    const trip = await Trip.findOneAndUpdate(
      filter,
      { 
        status: 'Completed',
        endTime: new Date()
      },
      { new: true }
    );

    if (!trip) {
       res.status(404).json({ success: false, error: { message: "Trip not found or unauthorized driver" } });
       return;
    }

    const TripHistoryModel = (await import('../models/TripHistory')).default;
    const historyRecord = await TripHistoryModel.findOne({ tripId: trip._id }).sort({ startTime: -1 });

    if (historyRecord) {
      historyRecord.status = 'completed';
      if (trip.endTime) {
        historyRecord.endTime = trip.endTime;
      }

      if (location && location.latitude && location.longitude) {
        historyRecord.endLocation = { lat: location.latitude, lng: location.longitude };
      }

      if (historyRecord.startTime && historyRecord.endTime) {
        // Calculate totalTime in minutes
        historyRecord.totalTime = Math.round((historyRecord.endTime.getTime() - historyRecord.startTime.getTime()) / 60000);
      }
      
      await historyRecord.save();
    }

    // Remove the driver from the live map tracking
    removeDriverLocation(req.user._id.toString());

    res.status(200).json({
      success: true,
      message: "Trip Completed",
      data: {
        trip: {
          id: trip._id,
          status: trip.status,
          endTime: trip.endTime
        }
      }
    });
  } catch(error) {
    next(error);
  }
};

// Validate QR without boarding
export const validateQR = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { qrPayload, tripId } = req.body;

    if (!qrPayload) {
      res.status(400).json({ success: false, error: { message: "qrPayload (Booking ID) is required"} });
      return;
    }

    const booking = await Booking.findById(qrPayload);
    if (!booking) {
      res.status(404).json({ success: false, error: { message: "Invalid QR code: Booking not found" } });
      return;
    }

    if (booking.status === 'Boarded') {
      res.status(400).json({ success: false, error: { message: "Passenger already boarded using this ticket" } });
      return;
    }

    if (tripId && booking.trip !== tripId.toString()) {
      res.status(400).json({ success: false, error: { message: "This booking is for a different trip" } });
      return;
    }

    const passenger = await User.findById(booking.passenger);
    if (!passenger) {
      res.status(404).json({ success: false, error: { message: "Passenger account not found" } });     
      return;
    }

    const trip = await Trip.findById(booking.trip).populate('routeId');
    if (!trip) {
       res.status(400).json({ success: false, error: { message: "Associated trip missing or inactive"} });
       return;
    }

    let currentStopName = "Unknown Stop";
    if (trip.routeId) {
      const routeInfo: any = trip.routeId;
      currentStopName = routeInfo.stops && routeInfo.stops[trip.currentStopIndex] ? routeInfo.stops[trip.currentStopIndex].name : "Unknown Stop";
    }

    res.status(200).json({
      success: true,
      data: {
        isValid: true,
        passenger: {
          id: passenger._id,
          name: passenger.name
        },
        expectedStop: currentStopName,
        busNumber: (trip as any).bus || 'Unknown Bus'
      }
    });

  } catch(error) {
    next(error);
  }
};

// Scan and validate QR
export const scanQR = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {  
  try {
    const { qrPayload, tripId, location } = req.body;

    if (!qrPayload) {
      res.status(400).json({ success: false, error: { message: "qrPayload (Booking ID) is required"} });
      return;
    }

    const booking = await Booking.findById(qrPayload);
    if (!booking) {
      res.status(404).json({ success: false, error: { message: "Invalid QR code: Booking not found" } });
      return;
    }

    if (booking.status === 'Boarded') {
      res.status(400).json({ success: false, error: { message: "Passenger already boarded using this ticket" } });
      return;
    }

    if (tripId && booking.trip !== tripId.toString()) {
      res.status(400).json({ success: false, error: { message: "This booking is for a different trip" } });
      return;
    }

    const passenger = await User.findById(booking.passenger);
    if (!passenger) {
      res.status(404).json({ success: false, error: { message: "Passenger account not found" } });     
      return;
    }

    const trip = await Trip.findById(booking.trip).populate('routeId');
    if (!trip) {
       res.status(400).json({ success: false, error: { message: "Associated trip missing or inactive"} });
       return;
    }

    let currentStopName = "Unknown Stop";
    if (trip.routeId) {
      const routeInfo: any = trip.routeId;
      currentStopName = routeInfo.stops && routeInfo.stops[trip.currentStopIndex] ? routeInfo.stops[trip.currentStopIndex].name : "Unknown Stop";
    }

    // Changing booking status to 'Boarded'
    booking.status = 'Boarded';
    await booking.save();

    const history = await BoardingHistory.create({
      passengerId: passenger._id,
      passengerName: passenger.name,
      tripId: trip._id,
      bookingId: booking._id,
      boardedAtStop: currentStopName,
      busNumber: (trip as any).bus || 'Unknown Bus',
      location: location || undefined
    });

    res.status(200).json({
      success: true,
      data: {
        isValid: true,
        passenger: {
          id: passenger._id,
          name: passenger.name
        },
        boardedAt: (history as any).timestamp,
        historyRecord: history
      }
    });

  } catch(error) {
    next(error);
  }
};
