import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { authenticateToken } from './jwt';
import { corsHandling, rateLimiting, SqlinjectionPrevention, XSSPrevention } from './security';

const app = express();
app.use(express.json());
app.use(express.static('public'));
const PORT = 3003;

// Security middlewares trước (không cần auth)
app.use(corsHandling);
// app.use(rateLimiting);
// app.use(XSSPrevention);
// app.use(SqlinjectionPrevention);

// Health check (không cần auth)
app.get('/health', async (req, res) => {
  res.send('Hello from Express Middleware Service!');
});

app.get('/getToken', async (req, res) => {
  const { generateAccessTokenForAPIGateway } = await import('./jwt');
  const token = generateAccessTokenForAPIGateway();
  res.status(200).json({ token });
})


const SERVICES = {
  auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  project: process.env.PROJECT_SERVICE_URL || 'http://localhost:5000',
  orchestrator: process.env.ORCHESTRATOR_SERVICE_URL || 'http://localhost:8080',
  ml: process.env.ML_SERVICE_URL || 'http://localhost:4040'
};

// Auth Service - KHÔNG cần authentication
app.use('/api/auth', createProxyMiddleware({
  target: SERVICES.auth,
  changeOrigin: true,
  pathRewrite: { '^/api/auth': '' }
}));

// Project Service - CẦN authentication
app.use('/api/projects',
  authenticateToken,
  createProxyMiddleware({
    target: SERVICES.project,
    changeOrigin: true,
    pathRewrite: { '^/api/projects': '' }
  })
);

// Orchestrator Service - CẦN authentication
app.use('/api/orchestrator',
  authenticateToken,
  createProxyMiddleware({
    target: SERVICES.orchestrator,
    changeOrigin: true,
    pathRewrite: { '^/api/deploy': '' }
  })
);

// GitHub OAuth - KHÔNG cần authentication
app.use('/api/github', createProxyMiddleware({
  target: SERVICES.project,
  changeOrigin: true,
  pathRewrite: { '^/api/github': '/github' }
}));

// GitLab OAuth - KHÔNG cần authentication
app.use('/api/gitlab', createProxyMiddleware({
  target: SERVICES.project,
  changeOrigin: true,
  pathRewrite: { '^/api/gitlab': '/gitlab' }
}));

// ML Service - CẦN authentication
app.use('/api/ml',
  authenticateToken,
  createProxyMiddleware({
    target: SERVICES.ml,
    changeOrigin: true,
    pathRewrite: { '^/api/ml': '' }
  })
);


app.listen(PORT, () => {
  console.log(`API Gateway is running at http://localhost:${PORT}`);
  console.log('📡 Proxying to:');
  Object.entries(SERVICES).forEach(([name, url]) => {
    console.log(`   ${name}: ${url}`);
  });
});