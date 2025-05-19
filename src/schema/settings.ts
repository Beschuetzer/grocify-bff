import mongoose, { Schema } from 'mongoose';

const settingsSchema = new mongoose.Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', unique: true },
  currentStoreId: String,
  sortOrderValues: {
    items: {
        sortBy: String,
        sortOrder: String,
    },
    stores: {
        sortBy: String,
        sortOrder: String,
    },
  }
});

settingsSchema.index({ userId: 1 });

export const SettingsSchema = mongoose.model('Settings', settingsSchema);
