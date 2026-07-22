import { Router } from 'express';
import { registerUser, loginUser, adminLogin, getMe, updateStreak } from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/admin-login', adminLogin);
router.get('/me', protect, getMe);
router.post('/streak', protect, updateStreak);

export default router;