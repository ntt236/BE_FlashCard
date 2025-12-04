import mongoose, { Document, Schema } from "mongoose";

export interface IQuestion {
    question: string;
    options: string[];
    correctAnswer: string;
    explanation?: string;
}

export interface IQuiz extends Document {
    ownerId: string;
    title: string;
    topic: string;
    // Sửa Interface cho phép cả viết hoa
    difficulty: 'Easy' | 'Medium' | 'Hard';
    questions: IQuestion[];
    score?: number;
}

const QuizSchema = new Schema<IQuiz>({
    ownerId: { type: String, required: true },
    title: { type: String, required: true },
    topic: { type: String },

    // 1. SỬA ENUM: Cho phép viết hoa để khớp với Frontend
    difficulty: {
        type: String,
        enum: ['Easy', 'Medium', 'Hard'], // Viết hoa chữ cái đầu
        default: 'Easy'
    },

    questions: [
        {
            question: { type: String, required: true },
            options: [{ type: String, required: true }],

            // 2. SỬA LỖI CHÍNH TẢ: correctAnsewer -> correctAnswer
            correctAnswer: { type: String, required: true },

            explanation: { type: String }
        }
    ],
    score: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model<IQuiz>('Quiz', QuizSchema);