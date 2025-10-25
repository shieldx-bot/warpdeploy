import 'dotenv/config';
import express, { type Express, type Request, type Response } from 'express';
import cors from 'cors';
import { connectDB } from './database/connectDB.js';
import AuthGithubRouter from './routers/auth/AuthGithub.js';
import VerifyOtpRouter from './routers/email/VerifyOtp.js';
import { router as SendOtpRouter } from './routers/email/SendOtp.js';
import SignUpRouter from './routers/users/Signup.js';

const app: Express = express();
const port = process.env.PORT_SERVICE_BACKEND || 5000;

app.use(express.json());
app.use(
  cors({
    origin: 'http://localhost:5173',
  })
);

// void connectDB();

app.get('/', (req: Request, res: Response) => {
  res.send('Hello from TypeScript Express!');
});

app.use('/github', AuthGithubRouter);
app.use(SendOtpRouter);
app.use(VerifyOtpRouter);
app.use(SignUpRouter);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});