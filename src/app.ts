import express, { Request, Response } from 'express';
import { config } from './config';
import mongoose from 'mongoose';
import { Item } from './schema'
import { getRandomInt } from './helpers';

const app = express();

const dbName = "grocify";
const mongoDbURL = `mongodb+srv://admin:${process.env.mongoDBPassword}@cluster0.3trbv.mongodb.net/${dbName}?retryWrites=true&w=majority`;

mongoose.connect(mongoDbURL)
  .then(() => console.log(`Connected to ${dbName} collection in MongoDB!`))
  .catch((error) => console.log(error.message));


app.listen(config.server.port, () => {
  console.log(`App running on port ${config.server.port}`);
});

app.get('/create', async (req: Request, res: Response) => {
  const createdItem = new Item({
    addedDate: Date.now() - getRandomInt(1000000, 1000000000),
    frequency: getRandomInt(1, 10),
    unit: 'day',
    name: "test item",
    upc: getRandomInt(1, 999999999999).toString().padStart(12, '0'),
    images: ['www.test.com'],
    imageToUseIndex: 0,
    fullscreenImage: 'www.test.com',
    lastUpdatedDate: Date.now(),
  })
  console.log({createdItem});
  try {
    await createdItem.save();
    res.send({createdItem})
  } catch (error) {
    res.send({error})    
  }
})

app.get('/', (req: Request, res: Response) => {
  res.send('Hello world!');
});
