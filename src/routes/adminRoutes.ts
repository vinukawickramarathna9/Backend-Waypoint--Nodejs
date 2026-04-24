import express from 'express';
import { createRoute, createUser, getUsers, updateUser, deleteUser, getRoutes, updateRoute, deleteRoute } from '../controllers/adminCtrl';
import { verifyToken, isAdmin } from '../middlewares/auth';

const router = express.Router();

router.use(verifyToken);
router.use(isAdmin);

router.post('/routes', createRoute);
router.get('/routes', getRoutes);
router.put('/routes/:id', updateRoute);
router.delete('/routes/:id', deleteRoute);

router.post('/users', createUser);
router.get('/users', getUsers);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

import { createBus, getBuses, updateBus, deleteBus, createTrip, getTrips, updateTrip, deleteTrip, createBooking, getBookings, updateBooking, deleteBooking } from '../controllers/adminCtrl';

router.post('/buses', createBus);
router.get('/buses', getBuses);
router.put('/buses/:id', updateBus);
router.delete('/buses/:id', deleteBus);

router.post('/trips', createTrip);
router.get('/trips', getTrips);
router.put('/trips/:id', updateTrip);
router.delete('/trips/:id', deleteTrip);

router.post('/bookings', createBooking);
router.get('/bookings', getBookings);
router.put('/bookings/:id', updateBooking);
router.delete('/bookings/:id', deleteBooking);
export default router;
