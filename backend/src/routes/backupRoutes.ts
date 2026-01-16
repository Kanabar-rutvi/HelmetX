import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware';
import { createBackup } from '../controllers/backupController';

const router = express.Router();

router.get('/download', protect, authorize('admin'), createBackup);

export default router;
