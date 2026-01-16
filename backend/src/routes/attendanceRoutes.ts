import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware';
import { getMyVitals, getMyDaily, getMyWeekly, getMyHistory, getOverview, verifyAttendance, checkIn, checkOut, getTodayAll, getAllLogs, getAllHistory, updateAttendance, getAuditLogs, getScanLogs, scanQR, approveAttendance, deleteAttendance } from '../controllers/attendanceController';

const router = express.Router();

router.get('/', protect, authorize('admin', 'supervisor'), getAllLogs);
router.get('/scans', protect, authorize('admin', 'supervisor'), getScanLogs);
router.get('/audit', protect, authorize('admin'), getAuditLogs);
router.get('/me/vitals', protect, getMyVitals);
router.get('/me/daily', protect, getMyDaily);
router.get('/me/weekly', protect, getMyWeekly);
router.get('/me/history', protect, getMyHistory);
router.get('/all-history', protect, authorize('admin'), getAllHistory);
router.get('/overview', protect, authorize('supervisor', 'admin'), getOverview);
router.get('/today', protect, authorize('supervisor', 'admin'), getTodayAll);
router.put('/:id/verify', protect, authorize('supervisor', 'admin'), verifyAttendance);
router.put('/:id', protect, authorize('admin'), updateAttendance);
router.delete('/:id', protect, authorize('supervisor', 'admin'), deleteAttendance);
router.post('/checkin', protect, checkIn);
router.post('/checkout', protect, checkOut);
router.post('/scan-qr', protect, authorize('supervisor', 'admin'), scanQR);
router.post('/approve', protect, authorize('supervisor', 'admin'), approveAttendance);

export default router;
