import { Router } from 'express';
import {
    getAllCouriers,
    getCourierById,
    getProfile,
    updateAvailability,
    updateProfile,
} from '../controllers/user';
import { authMiddleware, roleCheck } from '../middleware/auth';

const router = Router();

router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, updateProfile);
router.put('/availability', authMiddleware, roleCheck('courier'), updateAvailability);
router.get('/courier/:id', getCourierById);
router.get('/couriers', getAllCouriers);

export default router;
