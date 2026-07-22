import express from 'express';
import { getAllUsers, deleteUser, togglePinPath } from '../controllers/userController';
import { protect, isAdmin } from '../middleware/authMiddleware';

const router = express.Router();

// Admin routes
router.get('/', isAdmin, getAllUsers);
router.delete('/:id', isAdmin, deleteUser);

// User routes
router.patch('/pin/:pathId', protect, togglePinPath);

export default router;
