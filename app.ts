import express from 'express';

const PORT = 4000;
const app = express();

app.listen(PORT, () => {
  console.log(`App running on port ${PORT}`);
});

app.get('/', (req, res) => {
  res.send('Hello world!');
});
