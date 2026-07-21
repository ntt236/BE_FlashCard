import mongoose, { Schema, Document } from 'mongoose';

export interface ILearningPath extends Document {
  title: string;
  description: string;
  category: string; // THPT, IELTS, TOEIC...
  thumbnail?: string;
  isPinned: boolean;
  topics: mongoose.Types.ObjectId[]; // Array of FlashcardSet IDs
  ownerId: string; // Admin who created it
}

const LearningPathSchema = new Schema<ILearningPath>({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  category: { type: String, default: 'Chung' },
  thumbnail: { type: String },
  isPinned: { type: Boolean, default: false },
  topics: [{ type: Schema.Types.ObjectId, ref: 'FlashcardSet' }],
  ownerId: { type: String, required: true },
}, { timestamps: true });

export default mongoose.model<ILearningPath>('LearningPath', LearningPathSchema);
