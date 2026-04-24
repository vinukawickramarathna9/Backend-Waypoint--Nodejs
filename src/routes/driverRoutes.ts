import express from 'express';
import { getAssignedTrips, startTrip, endTrip, updateProgress, scanQR, validateQR } from '../controllers/driverCtrl';
import { verifyToken, isDriver } from '../middlewares/auth';

const router = express.Router();

router.use(verifyToken);
router.use(isDriver);

router.get('/trips', getAssignedTrips);
router.post('/trip/start', startTrip);
router.put('/trip/:id/progress', updateProgress);
router.post('/trip/:id/end', endTrip);
router.post('/validate-qr', validateQR);
router.post('/scan', scanQR);

export default router;
