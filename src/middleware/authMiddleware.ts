import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Mở rộng kiểu Request để có thể chứa thông tin user
export interface AuthRequest extends Request {
    user?: { id: string };
}

export const protect = (req: AuthRequest, res: Response, next: NextFunction) => {
    // 1. Lấy token từ header (Bearer <token>)
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ message: 'Không có quyền truy cập (No Token)' });
    }

    try {
        // 2. Giải mã token
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };

        // 3. Gán user ID vào req để dùng ở bước sau
        req.user = decoded;

        next(); // Cho phép đi tiếp
    } catch (error) {
        res.status(401).json({ message: 'Token không hợp lệ' });
    }
};