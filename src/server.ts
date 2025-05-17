import express from 'express';
import { config } from './config';
import os from 'os';
import mongoose from 'mongoose';
import itemRoutes from './routes/item';
import lastPurchasedRoutes from './routes/lastPurchasedMap';
import openAiRoutes from './routes/openAi';
import s3Routes from './routes/s3';
import storeRoutes from './routes/store';
import testRoutes from './routes/testing';
import userRoutes from './routes/user';
import inventoryRoutes from './routes/inventory';
import { getErrorMessage } from './helpers';

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
app.use(inventoryRoutes);
app.use(lastPurchasedRoutes);
app.use(openAiRoutes);
app.use(s3Routes);
app.use(storeRoutes);
app.use(testRoutes);
app.use(userRoutes);

//catch all other routes and return a 404
app.use((req, res, next) => {
  res.status(404).json(getErrorMessage(`'${req.originalUrl}' not found`));
});

const PORT = config.server.port;

const interfaces = os.networkInterfaces();
const addresses: string[] = [];
for (const iface of Object.values(interfaces)) {
  iface?.forEach((net) => {
    if (net.family === 'IPv4' && !net.internal) {
      addresses.push(net.address);
    }
  });
}

app.listen(PORT, () => {
  console.log(`App running on port ${PORT}`);
  if (addresses.length) {
    console.log('Server available at:');
    addresses.forEach((ip) => console.log(`http://${ip}:${PORT}`));
  } else {
    console.log('No external IPv4 address found.');
  }
});
