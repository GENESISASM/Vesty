import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
import { responseBuilder } from "../utils/response";
import { de } from "zod/locales";

export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
    }
}

export const authMiddleware = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): void => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json(responseBuilder(false, '401', null, 'Unauthorized'));
            return;
        }

        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json(responseBuilder(false, '401', null, 'Invalid token'));
    }
}