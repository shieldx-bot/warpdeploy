"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require('express');
const app = express();
const port = process.env.PORT_SERVICE_BACKEND || 5000;
console.log('PORT_SERVICE_BACKEND', port);
app.get('/', (req, res) => {
    res.send('Hello from TypeScript Express!');
});
const AuthGithubRouter = require('./routers/AuthGithub');
app.use('/auth/GetAccessTokenGithub', AuthGithubRouter);
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
//# sourceMappingURL=index.js.map