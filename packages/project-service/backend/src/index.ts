import './config/loadEnv.js';
import express, { type Express, type Request, type Response } from 'express';
import cors from 'cors';
// import { connectDB } from './database/connectDB.js';
import { connectDB } from './database/devDB.js';
import AuthGithubRouter from './routers/auth/AuthGithub.js';
import AuthGitlabRouter from './routers/auth/AuthGitlab.js';
import VerifyOtpRouter from './routers/email/VerifyOtp.js';
import { router as SendOtpRouter } from './routers/email/SendOtp.js';
import SignUpRouter from './routers/users/Signup.js';
import GetReposDBRouter from './routers/deployment/GetReposDB.js';

// Catch unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit - just log
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

const app: Express = express();
const port = process.env.PORT_SERVICE_BACKEND || 5000;

app.use(express.json());
app.use(
  cors({
    origin: 'http://localhost:5173',
  })
);

void connectDB();

app.get('/', (req: Request, res: Response) => {
  res.send('Hello from TypeScript Express!');
});

app.use('/github', AuthGithubRouter);
app.use('/gitlab', AuthGitlabRouter);
app.use(SendOtpRouter);
app.use(VerifyOtpRouter);
app.use(SignUpRouter);
app.use(GetReposDBRouter);



app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});