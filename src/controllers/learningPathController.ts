import { Request, Response } from 'express';
import LearningPath from '../models/LearningPath';
import FlashcardSet from '../models/FlashcardSet';
import { AuthRequest } from '../middleware/authMiddleware';

export const getPaths = async (req: Request, res: Response) => {
    try {
        const paths = await LearningPath.find().populate('topics');
        res.json(paths);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const createPath = async (req: AuthRequest, res: Response) => {
    try {
        const newPath = new LearningPath({ ...req.body, ownerId: 'admin' });
        await newPath.save();
        res.status(201).json(newPath);
    } catch (error) {
        res.status(500).json({ message: 'Failed to create', error });
    }
};

export const updatePath = async (req: AuthRequest, res: Response) => {
    try {
        const path = await LearningPath.findByIdAndUpdate(
            req.params.id,
            { ...req.body },
            { new: true }
        ).populate('topics');
        if (!path) return res.status(404).json({ message: 'Not found' });
        res.json(path);
    } catch (error) {
        res.status(500).json({ message: 'Failed to update', error });
    }
};

export const deletePath = async (req: Request, res: Response) => {
    try {
        await LearningPath.findByIdAndDelete(req.params.id);
        res.json({ message: 'Deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete', error });
    }
};

export const getPathById = async (req: Request, res: Response) => {
    try {
        const path = await LearningPath.findById(req.params.id).populate('topics');
        if (!path) return res.status(404).json({ message: 'Not found' });
        res.json(path);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const addTopicToPath = async (req: AuthRequest, res: Response) => {
    try {
        const path = await LearningPath.findById(req.params.id);
        if (!path) return res.status(404).json({ message: 'Path not found' });

        const { title, description } = req.body;
        const newTopic = new FlashcardSet({
            title,
            description,
            ownerId: 'admin'
        });
        await newTopic.save();

        path.topics.push(newTopic._id as any);
        await path.save();

        res.status(201).json(newTopic);
    } catch (error) {
        res.status(500).json({ message: 'Failed to add topic', error });
    }
};
