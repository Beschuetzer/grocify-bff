import express from 'express';
import { config } from './config';
import mongoose from 'mongoose';
import mongoDbRoutes from './routes/mongoDb'

const app = express();
const dbName = "grocify";
const mongoDbURL = `mongodb+srv://admin:${process.env.mongoDBPassword}@cluster0.3trbv.mongodb.net/${dbName}?retryWrites=true&w=majority`;

mongoose.connect(mongoDbURL)
  .then(() => console.log(`Connected to ${dbName} collection in MongoDB!`))
  .catch((error) => console.log(error.message));

//express config
app.use(express.json()); 

//routes
app.use(mongoDbRoutes)

app.listen(config.server.port, () => {
  console.log(`App running on port ${config.server.port}`);
});

