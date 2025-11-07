import { Request , Response, NextFunction } from "express";
import jwt from "jsonwebtoken";


export function authenticateToken(req: Request, res: Response, next: NextFunction) { 
    console.log('Authenticate Token Middleware triggered');
    const authHeader = req.headers['authorization']?.split(' ')[1];
    if( authHeader == null) return res.sendStatus(401);
    const token = authHeader;
    const verified = verifyAccessToken(token);
    if(!verified) return res.sendStatus(403);
    next();
}


function verifyAccessToken(token: string){ 
    console.log('Verifying access token');
    try { 
        // Verify token logic here
        const secret = process.env.ACCESS_TOKEN_SECRET || 'default_secret';
        const decoded = jwt.verify(token, secret);
        return decoded;
    }catch(error){ 
        return null;
    }
}


export  function generateAccessTokenForAPIGateway() { 
    const pyload = { 
        service: 'api-gateway',
    }
    const secretKey = process.env.API_GATEWAY_SECRET || 'default_secret';
    const token = jwt.sign(pyload, secretKey, { expiresIn: '7d' });
    return token;
}
