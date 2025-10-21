  const express = require('express');
  import type  { Express, Request, Response }  from 'express'
  const app: Express = express();
  const port = process.env.PORT || 3000;

  app.get('/', (req: Request, res: Response) => {
    res.send('Hello from TypeScript Express!');
  });

  const AuthGithubRouter = require('./routers/AuthGithub');
  app.use('/auth/GetAccessTokenGithub', AuthGithubRouter);

  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });