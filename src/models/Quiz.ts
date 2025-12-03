import { Document, Schema } from "mongoose";
import { required } from "zod/mini";

export interface IQuestion {
    question: string;
    options: string[];
    correctAnswer: string;
    explanation?: string
}

export interface IQuiz extends Document {
    ownerId: string;
    title: string;
    topic: string;
    difficulty: 'easy' | 'medium' | 'hard';
    questions: IQuestion[];
    score?: number;
}

const QuizSchema = new Schema<IQuiz>({
    ownerId: { type: String, required: true },
    title: { type: String, required: true },
    topic: { type: String },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'easy' },
    questions: [
        {
            question: { type: String, required: true },
            options: [{ type: String, required: true }],
            correctAnsewer: { type: String, required: true },
            explanation: { type: String }
        }
    ],
    score: { type: Number, default: 0 }
}, { timestamps: true })