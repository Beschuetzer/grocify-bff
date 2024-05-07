import express, { Request, Response } from 'express';
import { config } from './config';

const app = express();

app.listen(config.server.port, () => {
  console.log(`App running on port ${config.server.port}`);
});

app.get('/', (req: Request, res: Response) => {
  res.send('Hello world!');
});
