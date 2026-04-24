import { Request, Response, NextFunction } from 'express';
import { Route } from '../models/Route';
import { Trip } from '../models/Trip';

export const getAllTrips = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const trips = await Trip.find().populate('routeId').populate('driverId');
    res.status(200).json({
      success: true,
      data: { trips }
    });
  } catch (error) {
    next(error);
  }
};

export const getRoutes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const routes = await Route.find().select('name schedule stops');
    
    // Formatting as per the API contract
    const formattedRoutes = routes.map((route: any) => {
      // Logic for next Departure can be integrated based on realtime data or predefined logic
      const nextDeparture = route.schedule && route.schedule.length > 0 ? route.schedule[0].departureTime : "N/A";
      
      return {
        id: route._id,
        name: route.name,
        status: "active",  // Assuming all are active for now
        nextDeparture
      };
    });

    res.status(200).json({
      success: true,
      data: {
        routes: formattedRoutes
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getRouteById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const route = await Route.findById(req.params.id);
    
    if (!route) {
      res.status(404).json({ success: false, error: { message: "Route not found" } });
      return;
    }

    // formatting to API contract
    const formattedRoute = {
      id: route._id,
      name: route.name,
      stops: route.stops.map((stop: any) => ({
        name: stop.name,
        location: {
          lat: stop.location.coordinates[1],
          lng: stop.location.coordinates[0]
        }
      }))
    };

    res.status(200).json({
      success: true,
      data: {
        route: formattedRoute
      }
    });
  } catch (error) {
    next(error);
  }
};
