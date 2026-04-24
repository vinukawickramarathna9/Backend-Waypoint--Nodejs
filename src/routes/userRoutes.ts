import express from 'express';
import { getMe, getHistory, createBooking, getMyBookings } from '../controllers/userCtrl';
import { verifyToken } from '../middlewares/auth';

const router = express.Router();

router.use(verifyToken);

router.get('/me', getMe);
router.get('/history', getHistory);
router.post('/bookings', createBooking);
router.get('/bookings', getMyBookings);

export default router;
