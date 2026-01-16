import express from 'express';
import { protect } from '../middleware/authMiddleware';
import { getMyNotifications, markAsRead, markAllAsRead, createNotification } from '../controllers/notificationController';

const router = express.Router();

router.get('/', protect, getMyNotifications);
router.put('/:id/read', protect, markAsRead);
router.put('/read-all', protect, markAllAsRead);
router.post('/', protect, createNotification); // For testing/manual creation

export default router;
