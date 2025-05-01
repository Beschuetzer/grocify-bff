import mongoose, { Schema } from 'mongoose';

const itemSchema = new mongoose.Schema({
  /**
   *This a UUID v5 that the front end creates
   **/
  _id: String,
  addedDate: Number,
  /**
   *This is in milliseconds
   **/
  frequency: Number,
  fullscreenImage: String,
  images: [String],
  imageToUseIndex: Number,
  inventoryMinimum: Number,
  isFrozen: Boolean,
  lastUpdatedDate: Number,
  name: String,
  timeToExpiration: Number,
  unit: String,
  upc: String,
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
});

export const ItemSchema = mongoose.model('Item', itemSchema);
