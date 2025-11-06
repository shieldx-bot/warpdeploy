import jwt from 'jsonwebtoken';


export function generateAccessTokenForProjectService() { 
    const payload = { 
            service: 'project-service',
    }
    const secretKey = process.env.PROJECT_SERVICE_SECRET
    if (!secretKey) {
        throw new Error('PROJECT_SERVICE_SECRET is not defined in environment variables');
    }
    const token = jwt.sign(payload, secretKey, { expiresIn: '1h' });
    return token;
}