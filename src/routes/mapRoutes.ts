import express from 'express';
import { getRoute, searchLocation, updateDriverLocation, getDriverLocation, getAllDriverLocations } from '../controllers/mapCtrl';
import { verifyToken, isDriver, isAdmin } from '../middlewares/auth';

const router = express.Router();

// Public-ish (still needs JWT so we know who's calling)
router.use(verifyToken);

// Routing — any authenticated user can fetch a route (passenger, driver, admin)
router.post('/route', getRoute);

// Location search — any authenticated user
router.get('/search', searchLocation);

// Driver location updates — driver only
router.post('/driver/location', isDriver, updateDriverLocation);

// Read driver location — any authenticated user (passengers/admin need this)
router.get('/driver/:driverId/location', getDriverLocation);

// All driver locations — any authenticated user
router.get('/drivers/locations', getAllDriverLocations);

export default router;
