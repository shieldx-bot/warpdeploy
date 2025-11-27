"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_proxy_middleware_1 = require("http-proxy-middleware");
const jwt_1 = require("./jwt");
const security_1 = require("./security");
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use(express_1.default.static('public'));
const PORT = 3003;
// Security middlewares trước (không cần auth)
app.use(security_1.corsHandling);
// app.use(rateLimiting);
// app.use(XSSPrevention);
// app.use(SqlinjectionPrevention);
// Health check (không cần auth)
app.get('/health', async (req, res) => {
    res.send('Hello from Express Middleware Service!');
});
app.get('/getToken', async (req, res) => {
    const { generateAccessTokenForAPIGateway } = await Promise.resolve().then(() => __importStar(require('./jwt')));
    const token = generateAccessTokenForAPIGateway();
    res.status(200).json({ token });
});
const SERVICES = {
    auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
    project: process.env.PROJECT_SERVICE_URL || 'http://localhost:5000',
    orchestrator: process.env.ORCHESTRATOR_SERVICE_URL || 'http://localhost:8080',
    ml: process.env.ML_SERVICE_URL || 'http://localhost:4040'
};
// Auth Service - KHÔNG cần authentication
app.use('/api/auth', (0, http_proxy_middleware_1.createProxyMiddleware)({
    target: SERVICES.auth,
    changeOrigin: true,
    pathRewrite: { '^/api/auth': '' }
}));
// Project Service - CẦN authentication
app.use('/api/projects', jwt_1.authenticateToken, (0, http_proxy_middleware_1.createProxyMiddleware)({
    target: SERVICES.project,
    changeOrigin: true,
    pathRewrite: { '^/api/projects': '' }
}));
// Orchestrator Service - CẦN authentication
app.use('/api/orchestrator', jwt_1.authenticateToken, (0, http_proxy_middleware_1.createProxyMiddleware)({
    target: SERVICES.orchestrator,
    changeOrigin: true,
    pathRewrite: { '^/api/deploy': '' }
}));
// GitHub OAuth - KHÔNG cần authentication
app.use('/api/github', (0, http_proxy_middleware_1.createProxyMiddleware)({
    target: SERVICES.project,
    changeOrigin: true,
    pathRewrite: { '^/api/github': '/github' }
}));
// GitLab OAuth - KHÔNG cần authentication
app.use('/api/gitlab', (0, http_proxy_middleware_1.createProxyMiddleware)({
    target: SERVICES.project,
    changeOrigin: true,
    pathRewrite: { '^/api/gitlab': '/gitlab' }
}));
// ML Service - CẦN authentication
app.use('/api/ml', jwt_1.authenticateToken, (0, http_proxy_middleware_1.createProxyMiddleware)({
    target: SERVICES.ml,
    changeOrigin: true,
    pathRewrite: { '^/api/ml': '' }
}));
app.listen(PORT, () => {
    console.log(`API Gateway is running at http://localhost:${PORT}`);
    console.log('📡 Proxying to:');
    Object.entries(SERVICES).forEach(([name, url]) => {
        console.log(`   ${name}: ${url}`);
    });
});
