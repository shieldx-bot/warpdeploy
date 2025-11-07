"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAccessTokenForControlPlaneService = generateAccessTokenForControlPlaneService;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function generateAccessTokenForControlPlaneService() {
    const payload = {
        service: 'control-plane-service',
    };
    const secretKey = process.env.ACCESS_TOKEN_SECRET || 'default_secret';
    const token = jsonwebtoken_1.default.sign(payload, secretKey, { expiresIn: '7d' });
    return token;
}
