"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = authenticateToken;
exports.generateAccessTokenForAPIGateway = generateAccessTokenForAPIGateway;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function authenticateToken(req, res, next) {
    console.log('Authenticate Token Middleware triggered');
    const authHeader = req.headers['authorization']?.split(' ')[1];
    if (authHeader == null)
        return res.sendStatus(401);
    const token = authHeader;
    const verified = verifyAccessToken(token);
    if (!verified)
        return res.sendStatus(403);
    next();
}
function verifyAccessToken(token) {
    console.log('Verifying access token');
    try {
        // Verify token logic here
        const secret = process.env.ACCESS_TOKEN_SECRET || 'default_secret';
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        return decoded;
    }
    catch (error) {
        return null;
    }
}
function generateAccessTokenForAPIGateway() {
    const pyload = {
        service: 'api-gateway',
    };
    const secretKey = process.env.API_GATEWAY_SECRET || 'default_secret';
    const token = jsonwebtoken_1.default.sign(pyload, secretKey, { expiresIn: '7d' });
    return token;
}
