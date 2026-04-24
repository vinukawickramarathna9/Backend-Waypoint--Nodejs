import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { AuthRequest } from '../middlewares/auth';

// ─── In-memory driver location store ─────────────────────────────────────────
// Map<driverId, { latitude, longitude, timestamp, busName?, routeTitle?, routeId? }>
const driverLocations = new Map<string, { latitude: number; longitude: number; timestamp: string; busName?: string; routeTitle?: string; routeId?: string }>();

export const removeDriverLocation = (driverId: string) => {
  driverLocations.delete(driverId);
};

// ─── POST /api/v1/map/route ───────────────────────────────────────────────────
// Calls OpenRouteService and returns route geometry + distance + duration
export const getRoute = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { start, end, waypoints } = req.body;

    if (!waypoints && (!start?.lat || !start?.lng || !end?.lat || !end?.lng)) {
      res.status(400).json({ success: false, error: { message: 'start/end or waypoints are required' } });
      return;
    }

    const apiKey = process.env.ORS_API_KEY;
    if (!apiKey) {
      res.status(500).json({ success: false, error: { message: 'ORS_API_KEY not configured on server' } });
      return;
    }

    // ORS expects [lng, lat] order
    let coordsArray: [number, number][] = [];
    if (waypoints && Array.isArray(waypoints) && waypoints.length >= 2) {
      coordsArray = waypoints.map(w => [w.lng, w.lat]);
    } else {
      coordsArray = [
        [start.lng, start.lat],
        [end.lng, end.lat],
      ];
    }

    const body = {
      coordinates: coordsArray,
    };

    const orsRes = await axios.post(
      'https://api.openrouteservice.org/v2/directions/driving-car/geojson',
      body,
      {
        headers: {
          Authorization: apiKey,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    const feature = orsRes.data?.features?.[0];
    if (!feature) {
      res.status(502).json({ success: false, error: { message: 'No route found from ORS' } });
      return;
    }

    const summary = feature.properties?.summary;
    // Convert ORS [lng, lat] coords to { latitude, longitude } for React Native maps
    const coordinates: { latitude: number; longitude: number }[] = feature.geometry.coordinates.map(
      ([lng, lat]: [number, number]) => ({ latitude: lat, longitude: lng })
    );

    res.status(200).json({
      success: true,
      data: {
        coordinates,
        distance: summary?.distance || 0,   // metres
        duration: summary?.duration || 0,   // seconds
      },
    });
  } catch (error: any) {
    if (error.response?.status === 403) {
      res.status(403).json({ success: false, error: { message: 'Invalid ORS API key' } });
      return;
    }
    next(error);
  }
};

// ─── GET /api/v1/map/search?q= ────────────────────────────────────────────────
// Calls Nominatim and returns top 5 places
export const searchLocation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const q = req.query.q as string;
    if (!q || q.trim().length < 2) {
      res.status(400).json({ success: false, error: { message: 'Query must be at least 2 characters' } });
      return;
    }

    const nomRes = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q,
        format: 'json',
        limit: 5,
        addressdetails: 1,
      },
      headers: {
        'User-Agent': 'WayPoint-Shuttle-App/1.0 (contact@waypoint.dev)',
      },
      timeout: 8000,
    });

    const results = nomRes.data.map((item: any) => ({
      display_name: item.display_name,
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
    }));

    res.status(200).json({ success: true, data: { results } });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/v1/map/driver/location ─────────────────────────────────────────
// Driver pushes current GPS; stored in-memory + emitted via socket
export const updateDriverLocation = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { latitude, longitude, busName, routeTitle, routeId } = req.body;

    if (latitude === undefined || longitude === undefined) {
      res.status(400).json({ success: false, error: { message: 'latitude and longitude are required' } });
      return;
    }

    const driverId = req.user._id.toString();
    const timestamp = new Date().toISOString();

    driverLocations.set(driverId, { latitude, longitude, timestamp, busName, routeTitle, routeId });

    res.status(200).json({
      success: true,
      data: { driverId, latitude, longitude, timestamp, busName, routeTitle, routeId },
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/v1/map/driver/:driverId/location ────────────────────────────────
// Return the latest stored location for a given driver
export const getDriverLocation = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const driverId = req.params.driverId as string;
    const loc = driverLocations.get(driverId);

    if (!loc) {
      res.status(404).json({ success: false, error: { message: 'No location found for this driver' } });
      return;
    }

    res.status(200).json({ success: true, data: loc });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/v1/map/drivers/locations ───────────────────────────────────────
// Return all active driver locations (for admin view)
export const getAllDriverLocations = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const locations: Record<string, any> = {};
    driverLocations.forEach((loc, id) => {
      locations[id] = loc;
    });
    res.status(200).json({ success: true, data: { locations } });
  } catch (error) {
    next(error);
  }
};
