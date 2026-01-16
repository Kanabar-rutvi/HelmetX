import express from 'express';
import { registerUser, loginUser, getMe, requestOtp, verifyOtp } from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/request-otp', requestOtp);
router.post('/verify-otp', verifyOtp);
router.get('/me', protect, getMe);

export default router;
