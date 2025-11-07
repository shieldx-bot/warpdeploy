"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5305;
app.get('/health', (req, res) => {
    res.send("Data Plane Service is healthy");
});
app.listen(PORT, () => {
    console.log(`Data Plane Service is running on port ${PORT}`);
});
