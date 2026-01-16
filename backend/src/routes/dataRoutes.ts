import express from 'express';
import { getSensorData, getAlerts, createAlert, updateAlertStatus, escalateAlert, getSafetySummary, ingestSensorData } from '../controllers/dataController';
import { protect } from '../middleware/authMiddleware';
import { authorize } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/sensors/:deviceId', protect, getSensorData);
router.get('/alerts', protect, getAlerts);
router.post('/alerts', protect, createAlert);
router.put('/alerts/:id', protect, authorize('admin', 'supervisor'), updateAlertStatus);
router.post('/alerts/:id/escalate', protect, authorize('admin', 'supervisor'), escalateAlert);
router.get('/safety/summary', protect, authorize('admin', 'supervisor'), getSafetySummary);
router.post('/ingest', ingestSensorData);

export default router;
