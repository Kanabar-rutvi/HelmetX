import express from 'express';
import { getConfig, updateConfig } from '../controllers/configController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/', protect, authorize('admin', 'supervisor'), getConfig);
router.put('/', protect, authorize('admin'), updateConfig);

export default router;
