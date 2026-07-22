import { Request, Response } from 'express';
import User from '../models/User';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../middleware/authMiddleware';

// Tạo JWT token (có thể truyền role)
const generateToken = (id: string, role: string = 'user') => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET as string, {
        expiresIn: '30d',
    });
};

// Helper lấy số ngày từ Date
const toDateString = (date: Date) => date.toISOString().split('T')[0];

// @desc    Đăng ký user mới
// @route   POST /api/auth/register
export const registerUser = async (req: Request, res: Response) => {
    const { username, email, password } = req.body;

    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'Email này đã được sử dụng' });
        }

        const user = await User.create({ username, email, password });

        if (user) {
            res.status(201).json({
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                streak: user.streak,
                learnedWords: user.learnedWords,
                pinnedPaths: user.pinnedPaths,
                token: generateToken(user._id.toString(), user.role),
            });
        } else {
            res.status(400).json({ message: 'Dữ liệu không hợp lệ' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// @desc    Đăng nhập user thường
// @route   POST /api/auth/login
export const loginUser = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    try {
        const user: any = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                streak: user.streak,
                learnedWords: user.learnedWords,
                pinnedPaths: user.pinnedPaths,
                token: generateToken(user._id.toString(), user.role),
            });
        } else {
            res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// @desc    Đăng nhập Admin (dùng credentials từ .env)
// @route   POST /api/auth/admin-login
export const adminLogin = async (req: Request, res: Response) => {
    const { username, password } = req.body;

    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminUsername || !adminPassword) {
        return res.status(500).json({ message: 'Admin credentials chưa được cấu hình trong server' });
    }

    if (username === adminUsername && password === adminPassword) {
        // Admin không có _id trong DB, dùng id đặc biệt
        const token = generateToken('admin', 'admin');
        res.json({
            _id: 'admin',
            username: adminUsername,
            email: 'admin@system.local',
            role: 'admin',
            token,
        });
    } else {
        res.status(401).json({ message: 'Tài khoản hoặc mật khẩu Admin không đúng' });
    }
};

// @desc    Lấy thông tin user hiện tại
// @route   GET /api/auth/me
export const getMe = async (req: AuthRequest, res: Response) => {
    try {
        // Admin không có record trong DB
        if (req.user?.role === 'admin') {
            return res.json({
                _id: 'admin',
                username: process.env.ADMIN_USERNAME || 'admin',
                email: 'admin@system.local',
                role: 'admin',
                streak: 0,
                learnedWords: 0,
                pinnedPaths: [],
            });
        }

        const user = await User.findById(req.user?.id)
            .select('-password')
            .populate('pinnedPaths', 'title category description topics');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Cập nhật streak khi user học bài (gọi sau khi lưu progress)
// @route   POST /api/auth/streak
export const updateStreak = async (req: AuthRequest, res: Response) => {
    try {
        const user = await User.findById(req.user?.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const today = toDateString(new Date());
        const lastStudy = user.lastStudyDate ? toDateString(user.lastStudyDate) : null;

        if (lastStudy === today) {
            // Đã học hôm nay rồi, không tăng streak
            return res.json({ streak: user.streak, message: 'Already studied today' });
        }

        // Kiểm tra có phải ngày liên tiếp không
        const yesterday = toDateString(new Date(Date.now() - 86400000));
        if (lastStudy === yesterday) {
            user.streak += 1;
        } else {
            // Bỏ ngày → reset
            user.streak = 1;
        }

        user.lastStudyDate = new Date();
        await user.save();

        res.json({ streak: user.streak });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};