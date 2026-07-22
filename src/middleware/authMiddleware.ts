import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
    user?: { id: string; role?: string };
}

// Middleware bảo vệ route: chỉ cần token hợp lệ (user thường)
export const protect = (req: AuthRequest, res: Response, next: NextFunction) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ message: 'Không có quyền truy cập (No Token)' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string; role?: string };
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token không hợp lệ' });
    }
};

// Middleware chỉ cho phép admin
export const isAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ message: 'Không có quyền truy cập' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string; role?: string };
        if (decoded.role !== 'admin') {
            return res.status(403).json({ message: 'Chỉ Admin mới có quyền thực hiện thao tác này' });
        }
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token không hợp lệ' });
    }
};