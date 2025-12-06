import { Request, Response } from 'express';
import User from '../models/User';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../middleware/authMiddleware';

// Hàm tạo Token nhanh
const generateToken = (id: string) => {
    return jwt.sign({ id }, process.env.JWT_SECRET as string, {
        expiresIn: '30d', // Token sống trong 30 ngày
    });
};

// @desc    Đăng ký user mới
// @route   POST /api/auth/register
export const registerUser = async (req: Request, res: Response) => {
    const { username, email, password } = req.body;

    try {
        // 1. Kiểm tra user tồn tại
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'Email này đã được sử dụng' });
        }

        // 2. Tạo user mới (Password sẽ tự hash nhờ middleware ở Bước 2)
        const user = await User.create({
            username,
            email,
            password,
        });

        // 3. Trả về info + Token
        if (user) {
            res.status(201).json({
                _id: user._id,
                username: user.username,
                email: user.email,
                token: generateToken(user._id.toString()), // <--- Quan trọng
            });
        } else {
            res.status(400).json({ message: 'Dữ liệu không hợp lệ' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// @desc    Đăng nhập
// @route   POST /api/auth/login
export const loginUser = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    try {
        // 1. Tìm user theo email
        const user: any = await User.findOne({ email });

        // 2. Check password bằng method ta đã viết ở Model
        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                username: user.username,
                email: user.email,
                token: generateToken(user._id.toString()), // <--- Trả về Token để FE dùng
            });
        } else {
            res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};


export const getMe = async (req: AuthRequest, res: Response) => {
    try {
        // req.user được gắn vào từ middleware 'protect'
        // .select('-password') để không trả về mật khẩu
        const user = await User.findById(req.user?.id).select('-password');

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};