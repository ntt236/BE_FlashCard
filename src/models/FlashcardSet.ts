import mongoose, { Schema, Document } from 'mongoose';

// Interface cho từng thẻ từ vựng
export interface IFlashcard {
  term: string;
  definition: string; // Nghĩa
  phonetic?: string;  // Phiên âm
  type?: string;      // Loại từ 
  level?: string;
  note?: string;
  examples?: Array<{ en?: string; vi?: string }>;
  status: 'new' | 'learning' | 'learned';
  nextReviewDate: Date;
  box: number;
}

// Interface cho bộ Flashcard (Map với UI FlashcardSetData)
export interface IFlashcardSet extends Document {
  title: string;
  description: string;
  isPublic: boolean;
  language: string;
  ownerId: string; // ID người tạo
  cards: IFlashcard[];
  // Các field ảo (virtuals) sẽ trả về stats cho UI
}

const FlashcardSchema = new Schema<IFlashcard>({
  term: { type: String, required: true },
  definition: { type: String, required: true },
  phonetic: { type: String },
  type: { type: String },
  level: { type: String }, // <-- Mới
  note: { type: String },  // <-- Mới
  examples: [              // <-- Mới (Mảng object)
    {
      en: { type: String },
      vi: { type: String }
    }
  ],
  status: { type: String, enum: ['new', 'learning', 'learned'], default: 'new' },
  nextReviewDate: { type: Date, default: Date.now },
  box: { type: Number, default: 0 }
});

const FlashcardSetSchema = new Schema<IFlashcardSet>({
  title: { type: String, required: true },
  description: { type: String },
  isPublic: { type: Boolean, default: false },
  language: { type: String, default: 'en' },
  ownerId: { type: String, required: true }, // Giả lập user ID
  cards: [FlashcardSchema]
}, { timestamps: true });

export default mongoose.model<IFlashcardSet>('FlashcardSet', FlashcardSetSchema);