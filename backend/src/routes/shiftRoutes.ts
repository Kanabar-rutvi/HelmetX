import express from 'express';
import { getShifts, createShift, updateShift, deleteShift } from '../controllers/shiftController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/', protect, authorize('admin'), getShifts);
router.post('/', protect, authorize('admin'), createShift);
router.put('/:id', protect, authorize('admin'), updateShift);
router.delete('/:id', protect, authorize('admin'), deleteShift);

export default router;
