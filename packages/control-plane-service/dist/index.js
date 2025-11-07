"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const health_1 = __importDefault(require("./api/health"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5304;
app.use(health_1.default);
app.listen(PORT, () => {
    console.log(`Control Plane Service is running on port ${PORT}`);
});
