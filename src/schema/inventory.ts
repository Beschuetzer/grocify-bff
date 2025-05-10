import mongoose, { Schema } from 'mongoose';

const inventorySchema = new mongoose.Schema({
  currentLocationId: String,
  locations: { type: Schema.Types.Mixed },
  items: { type: Schema.Types.Mixed },
  userId: { type: Schema.Types.ObjectId, ref: 'User', unique: true },
});

export const InventorySchema = mongoose.model('Inventory', inventorySchema);
