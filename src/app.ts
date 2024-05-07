import express from 'express';
import { config } from './config';

const app = express();

app.listen(config.server.port, () => {
  console.log(`App running on port ${config.server.port}`);
});

app.get('/', (req, res) => {
  res.send('Hello world!');
});
