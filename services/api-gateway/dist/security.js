"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqlinjectionPrevention = SqlinjectionPrevention;
exports.XSSPrevention = XSSPrevention;
exports.rateLimiting = rateLimiting;
exports.corsHandling = corsHandling;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const cors_1 = __importDefault(require("cors"));
// Middware to SQL Injection Prevention
function SqlinjectionPrevention(req, res, next) {
    console.log('SQL Injection Prevention Middleware triggered');
    const sqlPatterns = [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
        /(;|\-\-|\#|\/\*|\*\/)/g,
        /(\b(OR|AND)\b.*=.*)/gi
    ];
    const checkForSQLInjection = (value) => {
        for (const pattern of sqlPatterns) {
            if (pattern.test(value)) {
                return true;
            }
        }
        return false;
    };
    for (const key in req.body) {
        if (typeof req.body[key] === 'string' && checkForSQLInjection(req.body[key])) {
            return res.status(400).send('Yêu cầu chứa các ký tự không hợp lệ.');
        }
        else {
            next();
        }
    }
    next();
}
;
// Middware to XSS Prevention
function XSSPrevention(req, res, next) {
    console.log('XSS Prevention Middleware triggered');
    const xssPatterns = [
        /<script.*?>.*?<\/script>/gi,
        /on\w+\s*=\s*(['"]).*?\1/gi,
        /javascript:\s*/gi
    ];
    const checkForXSS = (value) => {
        for (const pattern of xssPatterns) {
            if (pattern.test(value)) {
                return true;
            }
            else {
                return false;
            }
        }
    };
    for (const key in req.body) {
        if (typeof req.body[key] === 'string' && checkForXSS(req.body[key])) {
            return res.status(400).send('Yêu cầu chứa các ký tự không hợp lệ.');
        }
        else {
            next();
        }
        next();
    }
}
// Middware to Rate Limiting
function rateLimiting(req, res, next) {
    console.log('Rate Limiting Middleware triggered');
    const limiter = (0, express_rate_limit_1.default)({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // limit each IP to 100 requests per windowMs
    });
    limiter(req, res, next);
}
// Middware to CORS Handling
function corsHandling(req, res, next) {
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
    };
    (0, cors_1.default)(corsOptions)(req, res, next);
}
