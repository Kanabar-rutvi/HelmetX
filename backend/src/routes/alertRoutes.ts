import express from 'express';
import { getAlerts, updateAlertStatus, getAlertStats, createAlert } from '../controllers/alertController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/', protect, authorize('admin', 'supervisor'), getAlerts);
router.get('/stats', protect, authorize('admin', 'supervisor'), getAlertStats);
router.put('/:id', protect, authorize('admin', 'supervisor'), updateAlertStatus);
router.post('/', protect, authorize('admin'), createAlert);

export default router;
