import mongoose, { Schema, Document } from 'mongoose';

export interface IUserProgress extends Document {
    userId: mongoose.Types.ObjectId;
    flashcardSetId: mongoose.Types.ObjectId;
    learnedCardIds: string[]; // mảng card._id (string vì subdoc)
    updatedAt: Date;
}

const UserProgressSchema = new Schema<IUserProgress>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    flashcardSetId: { type: Schema.Types.ObjectId, ref: 'FlashcardSet', required: true },
    learnedCardIds: [{ type: String }],
}, { timestamps: true });

// Compound index: mỗi user chỉ có 1 record progress cho mỗi bộ từ
UserProgressSchema.index({ userId: 1, flashcardSetId: 1 }, { unique: true });

export default mongoose.model<IUserProgress>('UserProgress', UserProgressSchema);
