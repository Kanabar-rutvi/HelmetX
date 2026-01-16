import express from 'express';
import { getDevices, createDevice, updateDevice, deleteDevice, getWorkerLocations, getWorkerCountsBySite } from '../controllers/deviceController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/', protect, getDevices);
router.get('/locations', protect, authorize('supervisor', 'admin'), getWorkerLocations);
router.get('/locations/counts', protect, authorize('supervisor', 'admin'), getWorkerCountsBySite);
router.post('/', protect, authorize('admin'), createDevice);
router.put('/:id', protect, authorize('admin', 'supervisor'), updateDevice);
router.delete('/:id', protect, authorize('admin'), deleteDevice);

export default router;
