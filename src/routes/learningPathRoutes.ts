import express from 'express';
import { getPaths, createPath, togglePin, deletePath, getPathById, addTopicToPath } from '../controllers/learningPathController';

const router = express.Router();

router.get('/', getPaths);
router.get('/:id', getPathById);
router.post('/', createPath);
router.post('/:id/topics', addTopicToPath);
router.patch('/:id/pin', togglePin);
router.delete('/:id', deletePath);

export default router;
