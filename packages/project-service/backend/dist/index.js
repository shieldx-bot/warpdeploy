"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require('express');
const connectDB_1 = require("./database/connectDB");
const app = express();
const port = process.env.PORT_SERVICE_BACKEND || 5000;
app.use(express.json());
const cors = require('cors');
app.use(cors({
    origin: 'http://localhost:5173',
}));
(0, connectDB_1.connectDB)();
app.get('/', (req, res) => {
    res.send('Hello from TypeScript Express!');
});
const AuthGithubRouter = require('./routers/auth/AuthGithub');
app.use('/github', AuthGithubRouter);
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
//# sourceMappingURL=index.js.map