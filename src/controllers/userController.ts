import { Response } from 'express';
import User from '../models/User';
import { AuthRequest } from '../middleware/authMiddleware';

// @desc    Admin: Lấy danh sách tất cả users
// @route   GET /api/users
export const getAllUsers = async (req: AuthRequest, res: Response) => {
    try {
        const users = await User.find({}).select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};

// @desc    Admin: Xóa user
// @route   DELETE /api/users/:id
export const deleteUser = async (req: AuthRequest, res: Response) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User không tồn tại' });
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'Đã xóa user thành công' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};

// @desc    User: Toggle ghim / bỏ ghim một lộ trình
// @route   PATCH /api/users/pin/:pathId
export const togglePinPath = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { pathId } = req.params;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User không tồn tại' });

        const pathObjectId = pathId as any;
        const isPinned = user.pinnedPaths.some(id => id.toString() === pathId);

        if (isPinned) {
            // Bỏ ghim
            user.pinnedPaths = user.pinnedPaths.filter(id => id.toString() !== pathId) as any;
        } else {
            // Ghim
            user.pinnedPaths.push(pathObjectId);
        }

        await user.save();

        res.json({
            pinnedPaths: user.pinnedPaths,
            isPinned: !isPinned,
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};
