import { Router } from 'express';
import {
    createRating,
    getCourierRatings,
    getMyRatings,
    getOrderRating,
} from '../controllers/rating';
import { authMiddleware, roleCheck } from '../middleware/auth';

const router = Router();
router.post('/', authMiddleware, roleCheck('customer'), createRating);
router.get('/courier/:courierId', getCourierRatings);
router.get('/order/:orderId', authMiddleware, getOrderRating);
router.get('/my', authMiddleware, roleCheck('customer'), getMyRatings);

export default router;