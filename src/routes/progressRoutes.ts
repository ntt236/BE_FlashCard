import express from 'express';
import { getProgress, saveProgress, getProgressByPath } from '../controllers/progressController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// Tất cả routes đều cần đăng nhập
router.use(protect);

router.get('/path', getProgressByPath);          // GET /api/progress/path?setIds=a,b,c
router.get('/:setId', getProgress);              // GET /api/progress/:setId
router.post('/:setId', saveProgress);            // POST /api/progress/:setId

export default router;
