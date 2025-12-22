import { Router } from 'express';
import {
    createAddress,
    deleteAddress,
    getAddress,
    getAddresses,
    getNearbyAddresses,
    setDefaultAddress,
    updateAddress,
} from '../controllers/address';
import { authMiddleware, roleCheck } from '../middleware/auth';

const router = Router();
router.post('/', authMiddleware, roleCheck('customer'), createAddress);
router.get('/', authMiddleware, roleCheck('customer'), getAddresses);
router.get('/nearby', authMiddleware, roleCheck('courier'), getNearbyAddresses);
router.get('/:id', authMiddleware, roleCheck('customer'), getAddress);
router.put('/:id', authMiddleware, roleCheck('customer'), updateAddress);
router.put('/:id/default', authMiddleware, roleCheck('customer'), setDefaultAddress);
router.delete('/:id', authMiddleware, roleCheck('customer'), deleteAddress);

export default router;