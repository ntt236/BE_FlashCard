import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
    username: string;
    email: string;
    password: string;
    role: 'user' | 'admin';
    streak: number;
    lastStudyDate: Date | null;
    learnedWords: number;
    pinnedPaths: mongoose.Types.ObjectId[];
    matchPassword(enteredPassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    streak: { type: Number, default: 0 },
    lastStudyDate: { type: Date, default: null },
    learnedWords: { type: Number, default: 0 },
    pinnedPaths: [{ type: Schema.Types.ObjectId, ref: 'LearningPath' }],
}, { timestamps: true });

// Mongoose 9: pre hook không dùng next() nữa, dùng async/await thuần
UserSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.matchPassword = async function (enteredPassword: string): Promise<boolean> {
    return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model<IUser>('User', UserSchema);