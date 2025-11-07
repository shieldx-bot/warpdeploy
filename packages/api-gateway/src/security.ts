import { Request, Response, NextFunction } from "express";
import rateLimit from 'express-rate-limit';
import cors from 'cors';
// Middware to SQL Injection Prevention

export function SqlinjectionPrevention(req: Request, res: Response, next: NextFunction) {
    console.log('SQL Injection Prevention Middleware triggered');
    const sqlPatterns = [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
        /(;|\-\-|\#|\/\*|\*\/)/g,
        /(\b(OR|AND)\b.*=.*)/gi
    ];

    const checkForSQLInjection = (value: string) => {
        for (const pattern of sqlPatterns) {
            if (pattern.test(value)) {
                return true;
            }
        }
        return false;
    }
    for (const key in req.body) {
        if (typeof req.body[key] === 'string' && checkForSQLInjection(req.body[key])) {
            return res.status(400).send('Yêu cầu chứa các ký tự không hợp lệ.');
        } else {
            next();
        }
    }
    next();

};


// Middware to XSS Prevention
export function XSSPrevention(req: Request, res: Response, next: NextFunction) {
    console.log('XSS Prevention Middleware triggered');
    const xssPatterns = [
        /<script.*?>.*?<\/script>/gi,
        /on\w+\s*=\s*(['"]).*?\1/gi,
        /javascript:\s*/gi
    ];
    const checkForXSS = (value: string) => {
        for (const pattern of xssPatterns) {
            if (pattern.test(value)) {
                return true;
            } else {
                return false;
            }
        }
    }
    for (const key in req.body) {
        if (typeof req.body[key] === 'string' && checkForXSS(req.body[key])) {
            return res.status(400).send('Yêu cầu chứa các ký tự không hợp lệ.');
        } else {
            next();
        }
        next();
    }
}


// Middware to Rate Limiting
export function rateLimiting(req: Request, res: Response, next: NextFunction) {
    console.log('Rate Limiting Middleware triggered');
    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // limit each IP to 100 requests per windowMs
    })
    limiter(req, res, next);

}


// Middware to CORS Handling
export function corsHandling(req: Request, res: Response, next: NextFunction) {
    console.log('CORS Handling Middleware triggered');
    const corsOptions = {
        origin: '*',
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        credentials: true,
        optionsSuccessStatus: 204,
        // Headers allowed 
        allowedHeaders: [
            'Origin',
            'X-Requested-With',
            'Content-Type',
            'Accept',
            'Authorization',
            'Cache-Control',
            'X-Access-Token'
        ],
        // Headers exposed to client
        exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
        preflightContinue: false,
        maxAge: 86400,


    }
    cors(corsOptions)(req, res, next);
}
