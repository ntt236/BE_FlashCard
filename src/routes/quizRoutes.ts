import { Router } from "express";
// import { createQuiz } from "../controllers/quizController";
import { protect } from "../middleware/authMiddleware";
import multer from 'multer';
import { createQuiz } from "../controllers/quizController";


const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Route tạo Quiz (Hỗ trợ upload file)
router.post('/generate', protect, upload.single('file'), createQuiz);

export default router;