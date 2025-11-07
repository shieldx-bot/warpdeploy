"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAccessTokenForDataPlaneService = generateAccessTokenForDataPlaneService;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function generateAccessTokenForDataPlaneService() {
    const payload = {
        service: "data-plane-service"
    };
    const secret = process.env.ACCESS_TOKEN_SECRET || "default_secret";
    if (!secret) {
        throw new Error("ACCESS_TOKEN_SECRET is not defined");
    }
    const token = jsonwebtoken_1.default.sign(payload, secret, { expiresIn: '1h' });
    return token;
}
