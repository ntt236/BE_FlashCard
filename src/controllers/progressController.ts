import { Response } from 'express';
import UserProgress from '../models/UserProgress';
import User from '../models/User';
import FlashcardSet from '../models/FlashcardSet';
import { AuthRequest } from '../middleware/authMiddleware';

// @desc    Lấy tiến trình học của user cho một bộ từ
// @route   GET /api/progress/:setId
export const getProgress = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { setId } = req.params;

        const progress = await UserProgress.findOne({ userId, flashcardSetId: setId });

        res.json({
            flashcardSetId: setId,
            learnedCardIds: progress?.learnedCardIds || [],
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};

// @desc    Cập nhật tiến trình học (replace toàn bộ learnedCardIds)
// @route   POST /api/progress/:setId
export const saveProgress = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { setId } = req.params;
        const { learnedCardIds } = req.body as { learnedCardIds: string[] };

        // Upsert: tạo mới nếu chưa có, cập nhật nếu có
        const progress = await UserProgress.findOneAndUpdate(
            { userId, flashcardSetId: setId },
            { learnedCardIds },
            { upsert: true, new: true }
        );

        // Tính lại tổng số từ đã học của user (distinct across all sets)
        const allProgress = await UserProgress.find({ userId });
        const totalLearned = new Set(allProgress.flatMap(p => p.learnedCardIds)).size;

        await User.findByIdAndUpdate(userId, { learnedWords: totalLearned });

        // Cập nhật streak
        const user = await User.findById(userId);
        if (user) {
            const today = new Date().toISOString().split('T')[0];
            const lastStudy = user.lastStudyDate
                ? user.lastStudyDate.toISOString().split('T')[0]
                : null;

            if (lastStudy !== today) {
                const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
                user.streak = lastStudy === yesterday ? user.streak + 1 : 1;
                user.lastStudyDate = new Date();
                await user.save();
            }
        }

        res.json({
            learnedCardIds: progress.learnedCardIds,
            totalLearned,
            streak: user?.streak || 0,
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};

// @desc    Lấy tiến trình của user cho nhiều bộ từ (dùng trong PathDetail)
// @route   GET /api/progress/path/:pathId  (truyền mảng setIds qua query)
export const getProgressByPath = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const setIds = (req.query.setIds as string)?.split(',') || [];

        const progressList = await UserProgress.find({
            userId,
            flashcardSetId: { $in: setIds },
        });

        // Map thành object { setId: learnedCount }
        const result: Record<string, string[]> = {};
        for (const p of progressList) {
            result[p.flashcardSetId.toString()] = p.learnedCardIds;
        }

        res.json(result);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};
