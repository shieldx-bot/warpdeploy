import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';

// Issue a JWT for inter-service auth
export function generateAccessTokenForProjectService() {
    const payload = { service: 'project-service' };
    const secretKey = process.env.PROJECT_SERVICE_SECRET;
    if (!secretKey) {
        throw new Error('PROJECT_SERVICE_SECRET is not defined in environment variables');
    }
    return jwt.sign(payload, secretKey, { expiresIn: '1h' });
}

// Middleware to authenticate incoming requests carrying Bearer token
export default function authenticateToken(req: Request, res: Response, next: NextFunction) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ status: 'error', message: 'Missing or invalid Authorization header' });
        }
        const token = authHeader.substring('Bearer '.length);
        const secretKey = process.env.PROJECT_SERVICE_SECRET;
        if (!secretKey) {
            return res.status(500).json({ status: 'error', message: 'Server misconfigured: missing PROJECT_SERVICE_SECRET' });
        }
        jwt.verify(token, secretKey);
        return next();
    } catch (err) {
        return res.status(401).json({ status: 'error', message: 'Invalid or expired token' });
    }
}