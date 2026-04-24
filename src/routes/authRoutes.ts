import express from 'express';
import { register, login } from '../controllers/authCtrl';
import rateLimit from 'express-rate-limit';

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Increased from 10 to 100 for development purposes
  message: { success: false, error: { message: 'Too many requests from this IP, please try again after 15 minutes' } }
});

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);

export default router;
