import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware';
import { createMyReport, getMyTodayReport, getMyReports, addMaterials, createMaterials, getMaterialsStats, getMaterialsList, approveReport, updateMaterialStatus, getReportsPending, getMaterialsPending, getAllReports, getSiteSafetyReports } from '../controllers/reportController';

const router = express.Router();

router.get('/all', protect, authorize('admin', 'supervisor'), getAllReports);
router.get('/site-safety', protect, authorize('admin', 'supervisor'), getSiteSafetyReports);
router.post('/me', protect, authorize('worker'), createMyReport);
router.get('/me/today', protect, authorize('worker'), getMyTodayReport);
router.get('/me', protect, authorize('worker'), getMyReports);
router.put('/me/:id/materials', protect, authorize('worker'), addMaterials);
router.post('/materials', protect, authorize('worker'), createMaterials);
router.get('/materials/stats', protect, authorize('worker', 'supervisor', 'admin'), getMaterialsStats);
router.get('/materials/list', protect, authorize('worker', 'supervisor', 'admin'), getMaterialsList);
router.put('/:id/approval', protect, authorize('supervisor', 'admin'), approveReport);
router.put('/materials/:reportId/:materialId/status', protect, authorize('supervisor', 'admin'), updateMaterialStatus);
router.get('/pending', protect, authorize('supervisor', 'admin'), getReportsPending);
router.get('/materials/pending', protect, authorize('supervisor', 'admin'), getMaterialsPending);

export default router;
