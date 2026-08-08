import express from 'express';
import { config } from './config';
import os from 'os';
import mongoose from 'mongoose';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import itemRoutes from './routes/item';
import lastPurchasedRoutes from './routes/lastPurchasedMap';
import openAiRoutes from './routes/openAi';
import s3Routes from './routes/s3';
import storeRoutes from './routes/store';
import testRoutes from './routes/testing';
import userRoutes from './routes/user';
import inventoryRoutes from './routes/inventory';
import { getErrorMessage } from './helpers';
import { USER_PATH } from './routes/constants';

const app = express();
// app.set('trust proxy', 1);
const dbName = 'grocify';
const mongoDBPassword = process.env.mongoDBPassword;
if (!mongoDBPassword) {
  throw new Error('Missing required "mongoDBPassword" environment variable.');
}
const mongoDbURL = `mongodb+srv://admin:${mongoDBPassword}@cluster0.3trbv.mongodb.net/${dbName}?retryWrites=true&w=majority`;

mongoose
  .connect(mongoDbURL)
  .then(() => console.log(`Connected to ${dbName} collection in MongoDB!`))
  .catch((error) => console.log(error.message));

//express config
app.use(helmet());
app.use(express.json({ limit: '50mb' }));

// //rate limiting for auth-sensitive routes to slow down brute-force/credential-stuffing attempts
// const authRateLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   limit: 20,
//   standardHeaders: true,
//   legacyHeaders: false,
// });
// app.use(`${USER_PATH}`, authRateLimiter);

//routes
app.use(userRoutes);
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
