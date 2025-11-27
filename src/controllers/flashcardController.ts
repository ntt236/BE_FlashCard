import { Request, Response } from 'express';
import FlashcardSet from '../models/FlashcardSet';
import { generateFlashcardContent } from '../services/aiService';
import { AuthRequest } from '../middleware/authMiddleware';

// 1. Lấy danh sách Flashcard Set (Format cho UI)
export const getFlashcardSets = async (req: Request, res: Response) => {
    try {
        const sets = await FlashcardSet.find();

        // Map dữ liệu DB sang format UI (FlashcardSetData)
        const uiData = sets.map(set => {
            const learned = set.cards.filter(c => c.status === 'learned').length;
            const learning = set.cards.filter(c => c.status === 'learning').length;
            const newWord = set.cards.filter(c => c.status === 'new').length;
            const total = set.cards.length;

            // Tính accuracy giả định (hoặc lưu logic riêng)
            const accuracy = total > 0 ? Math.round((learned / total) * 100) : 0;

            return {
                _id: set._id,
                title: set.title,
                desc: set.description,
                learned,
                learning,
                newWord,
                accuracy
            };
        });

        res.json(uiData);
    } catch (error) {
        res.status(500).json({ message: "Error fetching sets" });
    }
};

// 2. Tạo Flashcard mới (Có hỗ trợ AI)
export const addCardToSet = async (req: Request, res: Response) => {
    const { setId } = req.params;
    const { mode, input } = req.body; // mode: 'manual' | 'ai'

    try {
        const set = await FlashcardSet.findById(setId);
        if (!set) return res.status(404).json({ message: "Set not found" });

        let newCardData;

        if (mode === 'ai') {
            // Gọi service AI đã viết ở bước 4
            newCardData = await generateFlashcardContent(input);
        } else {
            // Nhập tay (input là object đầy đủ)
            newCardData = input;
        }

        // Thêm vào mảng cards
        set.cards.push({ ...newCardData, status: 'new' });
        await set.save();

        res.json(set);
    } catch (error) {
        res.status(500).json({ message: "Error adding card" });
    }
};

// 3. Tạo Set mới
export const createSet = async (req: AuthRequest, res: Response) => {
    try {
        const { title, description, isPublic, language } = req.body;

        // Lấy ID thật từ người dùng đang đăng nhập
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ message: "User not authenticated" });
        }

        const newSet = new FlashcardSet({
            title,
            description,
            isPublic,
            language,
            ownerId: userId, // <-- Dùng ID thật ở đây
            cards: []
        });

        await newSet.save();
        res.status(201).json(newSet);
    } catch (error) {
        res.status(500).json({ message: "Error creating set" });
    }
}

// Hàm lấy "Bộ flashcard của tôi"
export const getMyFlashcards = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        // Chỉ tìm những bộ mà ownerId trùng với người đang đăng nhập
        const sets = await FlashcardSet.find({ ownerId: userId });
        // ... (logic map dữ liệu giống ở trên) ...
        res.json(sets);
    } catch (error) {
        res.status(500).json({ message: "Error" });
    }
}