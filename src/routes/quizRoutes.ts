import { Router } from "express";
// import { createQuiz } from "../controllers/quizController";
import { protect } from "../middleware/authMiddleware";
import multer from 'multer';
import { createQuiz, deleteQuiz, getMyQuizzes, getQuizById, updateQuiz } from "../controllers/quizController";


const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Route tạo Quiz (Hỗ trợ upload file)
router.post('/generate', protect, upload.single('file'), createQuiz);
// 2. Lấy danh sách (GET /api/quiz)
router.get('/', protect, getMyQuizzes);

// 3. Lấy chi tiết (GET /api/quiz/:id)
router.get('/:id', protect, getQuizById);

router.put('/:id', protect, updateQuiz);

router.delete('/:id', protect, deleteQuiz);


export default router;