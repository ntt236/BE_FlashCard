import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
// import Quiz from '../models/Quiz';
import { generateQuizContent } from '../services/aiService';
import { parseFileToText } from '../utils/fileParser';
import Quiz from '../models/Quiz';
// Hàm parse file đã viết bài trước (nếu chưa có bảo mình gửi lại)

export const createQuiz = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const {
            type, // 'topic' | 'text' | 'file'
            topic,
            description,
            textInput,
            count,
            difficulty
        } = req.body;

        let finalTextInput = "";

        // --- XỬ LÝ ĐẦU VÀO ---

        // Option 3: File Docx
        if (type === 'file' && req.file) {
            console.log("📂 Đang đọc file upload...");
            finalTextInput = await parseFileToText(req.file);
        }
        // Option 2: Nhập văn bản
        else if (type === 'text') {
            finalTextInput = textInput;
        }
        // Option 1: Chủ đề (Không cần textInput, AI tự chém)

        // --- GỌI AI ---
        console.log("🤖 Đang gọi AI tạo Quiz...");
        const aiResult = await generateQuizContent({
            topic,
            description,
            textInput: finalTextInput, // Nếu là Option 1 thì cái này rỗng
            count: Number(count),
            difficulty,
            language: 'vi'
        });

        // --- LƯU DB ---
        const newQuiz = new Quiz({
            ownerId: userId,
            title: aiResult.title || topic || "Bài kiểm tra mới",
            topic: topic || "Tổng hợp",
            difficulty,
            questions: aiResult.questions
        });

        await newQuiz.save();

        res.status(201).json(newQuiz);

    } catch (error) {
        console.error("Lỗi tạo Quiz:", error);
        res.status(500).json({ message: "Lỗi server khi tạo Quiz" });
    }
};


// 2. Lấy danh sách Quiz của tôi
export const getMyQuizzes = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        // Lấy danh sách, sắp xếp mới nhất lên đầu
        const quizzes = await Quiz.find({ ownerId: userId }).sort({ createdAt: -1 });
        res.json(quizzes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Lỗi lấy danh sách Quiz" });
    }
};

// 3. Lấy chi tiết 1 bài Quiz (để vào thi)
export const getQuizById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const quiz = await Quiz.findById(id);

        if (!quiz) {
            return res.status(404).json({ message: "Không tìm thấy bài kiểm tra" });
        }

        res.json(quiz);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Lỗi lấy chi tiết Quiz" });
    }
};


// 4. Cập nhật Quiz (Dùng khi sửa trong Preview)
export const updateQuiz = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { questions, title } = req.body; // Lấy danh sách câu hỏi mới

        const updatedQuiz = await Quiz.findByIdAndUpdate(
            id,
            { questions, title }, // Cập nhật lại mảng questions
            { new: true }
        );

        if (!updatedQuiz) return res.status(404).json({ message: "Quiz not found" });
        res.json(updatedQuiz);
    } catch (error) {
        res.status(500).json({ message: "Lỗi cập nhật Quiz" });
    }
};

// 5. Xóa Quiz (Dùng khi người dùng thấy AI tạo chán quá muốn xóa luôn)
export const deleteQuiz = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        await Quiz.findByIdAndDelete(id);
        res.json({ message: "Đã xóa Quiz" });
    } catch (error) {
        res.status(500).json({ message: "Lỗi xóa Quiz" });
    }
};