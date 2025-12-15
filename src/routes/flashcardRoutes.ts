import { Router } from "express";
import multer from 'multer'; // <--- 1. Import Multer

import {
    addCardToSet,
    createSet,
    deleteCards,
    deleteCardSet,
    getFlashcardSetById,
    getFlashcardSets,
    getMyFlashcards,
    uploadFileAndCreateCards // <--- Nhớ import hàm mới từ controller
} from "../controllers/flashcardController";
import { protect } from "../middleware/authMiddleware";

const router = Router();

// 2. Cấu hình Multer (Lưu file vào RAM tạm thời)
const upload = multer({ storage: multer.memoryStorage() });

router.get('/my-sets', protect, getMyFlashcards);
router.get('/', getFlashcardSets);
router.post('/', protect, createSet);

router.post('/:setId/cards', protect, addCardToSet);
router.get('/:setId', protect, getFlashcardSetById);
router.delete('/:setId/cards/:cardId', protect, deleteCards);
router.delete('/:setId', protect, deleteCardSet);
// 3. Route Upload (Sử dụng biến upload vừa tạo)
router.post('/:setId/upload', protect, upload.single('file'), uploadFileAndCreateCards);

export default router;