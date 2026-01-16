import express from 'express';
import { getSites, getSiteById, createSite, updateSite, deleteSite } from '../controllers/siteController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/', protect, authorize('admin'), getSites);
router.get('/:id', protect, authorize('admin', 'supervisor'), getSiteById);
router.post('/', protect, authorize('admin'), createSite);
router.put('/:id', protect, authorize('admin'), updateSite);
router.delete('/:id', protect, authorize('admin'), deleteSite);

export default router;
