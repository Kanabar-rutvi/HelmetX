import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware';
import { getAuditLogs } from '../controllers/auditController';

const router = express.Router();

router.get('/', protect, authorize('supervisor', 'admin'), getAuditLogs);

export default router;
