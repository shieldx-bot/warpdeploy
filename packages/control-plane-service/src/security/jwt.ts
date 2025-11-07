import jwt from 'jsonwebtoken';


export function generateAccessTokenForControlPlaneService() { 
    const payload  = { 
        service: 'control-plane-service',
    }
    const secretKey = process.env.ACCESS_TOKEN_SECRET || 'default_secret' ;
    const token = jwt.sign(payload, secretKey, { expiresIn: '7d' });
    return token;
}