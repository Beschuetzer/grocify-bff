import express from 'express';
import { config } from './config';
import mongoose from 'mongoose';
import itemRoutes from './routes/item';
import lastPurchasedRoutes from './routes/lastPurchasedMap';
import storeRoutes from './routes/store';
import testRoutes from './routes/testing';
import userRoutes from './routes/user';

const app = express();
const dbName = 'grocify';
const mongoDbURL = `mongodb+srv://admin:${process.env.mongoDBPassword}@cluster0.3trbv.mongodb.net/${dbName}?retryWrites=true&w=majority`;

mongoose
  .connect(mongoDbURL)
  .then(() => console.log(`Connected to ${dbName} collection in MongoDB!`))
  .catch((error) => console.log(error.message));

//express config
app.use(express.json({ limit: '50mb' }));

//routes
app.use(itemRoutes);
app.use(lastPurchasedRoutes);
app.use(storeRoutes);
app.use(testRoutes);
app.use(userRoutes);

app.listen(config.server.port, () => {
  console.log(`App running on port ${config.server.port}`);
});
