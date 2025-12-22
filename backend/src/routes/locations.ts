import { Router } from 'express';
import {
    getCourierLocations,
    getLatestLocation,
    getNearbyLocations,
    saveLocation,
} from '../controllers/location';
import { authMiddleware, roleCheck } from '../middleware/auth';

const router = Router();

router.post('/', authMiddleware, roleCheck('courier'), saveLocation);
router.get('/courier/:courierId', authMiddleware, getCourierLocations);
router.get('/latest/:courierId', authMiddleware, getLatestLocation);
router.get('/nearby', authMiddleware, getNearbyLocations);

export default router;