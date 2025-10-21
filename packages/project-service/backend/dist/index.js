"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require('express');
const app = express();
const port = process.env.PORT_SERVICE_BACKEND || 5000;
app.use(express.json());
const cors = require('cors');
app.use(cors({
    origin: `${process.env.DOMAIN_FRONTEND}:5173`,
}));
app.get('/', (req, res) => {
    res.send('Hello from TypeScript Express!');
});
const AuthGithubRouter = require('./routers/AuthGithub');
app.use('/github', AuthGithubRouter);
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
//# sourceMappingURL=index.js.map