import express from 'express';
import {
    assignOrder,
    cancelOrder,
    createOrder,
    deliverOrder,
    getActiveOrders,
    getOrderById,
    getOrders,
    updateOrderStatus,
} from '../controllers/order';
import { authMiddleware, roleCheck } from '../middleware/auth';

const router = express.Router();
router.use(authMiddleware);
router.post('/', roleCheck('customer'), createOrder);
router.get('/', getOrders);
router.get('/active', roleCheck('courier'), getActiveOrders);
router.get('/:id', getOrderById);
router.put('/:id/assign', roleCheck('courier'), assignOrder);
router.put('/:id/deliver', roleCheck('courier'), deliverOrder);
router.put('/:id/status', roleCheck('courier'), updateOrderStatus);
router.delete('/:id', cancelOrder);

export default router;