import express from 'express';
import { getRoutes, getRouteById, getAllTrips } from '../controllers/routeCtrl';
import { verifyToken } from '../middlewares/auth';

const router = express.Router();

router.use(verifyToken);

router.get('/', getRoutes);
router.get('/trips', getAllTrips);
router.get('/:id', getRouteById);

export default router;
