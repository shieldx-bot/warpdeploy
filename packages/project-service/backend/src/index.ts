  const express = require('express');
  import type  { Express, Request, Response }  from 'express'
  const app: Express = express();
  const port = process.env.PORT_SERVICE_BACKEND || 5000;
  
  app.use(express.json());
  const cors = require('cors');
  app.use(cors(
    { 
      origin: 'http://localhost:5173' ,
    }
  ));
  app.get('/', (req: Request, res: Response) => {
    res.send('Hello from TypeScript Express!');
  });

  const AuthGithubRouter = require('./routers/AuthGithub');
  app.use('/github', AuthGithubRouter);

  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });