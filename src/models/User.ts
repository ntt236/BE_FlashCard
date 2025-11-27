import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

// Schema User
const UserSchema = new Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
}, { timestamps: true });

// --- MIDDLEWARE MONGOOSE ---
// Chạy trước khi save() được gọi
UserSchema.pre('save', async function (next) {
    // Nếu password không bị thay đổi (ví dụ chỉ update email), thì bỏ qua
    if (!this.isModified('password')) {
        return;
    }

    // Tạo "muối" (salt) để mã hóa mạnh hơn
    const salt = await bcrypt.genSalt(10);
    // Mã hóa password
    this.password = await bcrypt.hash(this.password, salt);
});

// Method kiểm tra mật khẩu khi đăng nhập
UserSchema.methods.matchPassword = async function (enteredPassword: string) {
    return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model('User', UserSchema);