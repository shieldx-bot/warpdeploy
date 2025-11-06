 import jwt from 'jsonwebtoken';
 export function generateAccessTokenForORchestratorService() { 
    const payload = { 
         service: 'orchestrator-service',
    } ; 
    const secretKey = process.env.ORCHESTRATOR_SERVICE_SECRET
    if (!secretKey) { 
        throw new Error('ORCHESTRATOR_SERVICE_SECRET is not defined in environment variables');
    } 
    const token = jwt.sign(payload, secretKey, { expiresIn: '1h' });
    return token;

 }