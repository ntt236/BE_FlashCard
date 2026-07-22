import express from 'express';
import { getPaths, createPath, deletePath, getPathById, addTopicToPath, updatePath } from '../controllers/learningPathController';
import { isAdmin } from '../middleware/authMiddleware';

const router = express.Router();

// Public routes (user xem lộ trình)
router.get('/', getPaths);
router.get('/:id', getPathById);

// Admin-only routes
router.post('/', isAdmin, createPath);
router.put('/:id', isAdmin, updatePath);
router.post('/:id/topics', isAdmin, addTopicToPath);
router.delete('/:id', isAdmin, deletePath);

export default router;
