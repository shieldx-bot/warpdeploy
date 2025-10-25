import jwt from 'jsonwebtoken';
import {Request, Response, NextFunction } from 'express';




export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader =req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if(!token){ 
        return res.status(401).json({status: 'error', message: 'Access token missing'});
    }
    jwt.verify(token, process.env.JWT_SECRET as string, (err: any, user: any) => { 
        if(err){
            return res.status(403).json({status: 'error', message: 'Invalid access token'});
        }
        req.body.user = user;
        next();
    });
}

export default authenticateToken;