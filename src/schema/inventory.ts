import mongoose, { Schema } from 'mongoose';

const inventorySchema = new mongoose.Schema({
  currentLocationId: String,
  items: { type: Schema.Types.Mixed },
  locations: { type: Schema.Types.Mixed },
  userId: { type: Schema.Types.ObjectId, ref: 'User', unique: true },
});

/**
* *The index corresponds to the field name in the schema.
**/
const inventoryLocationsFieldNameIndex = 2;
export const inventoryLocationsFieldName = Object.keys(
    inventorySchema.paths
)[inventoryLocationsFieldNameIndex];


// Create an index on userId (used in most filters)
inventorySchema.index({ userId: 1 });

// // Create a wildcard index on the items field to index any subfields (e.g. items.<locationId>.<itemId>)
// inventorySchema.index({ "items.$**": 1 });

export const InventorySchema = mongoose.model('Inventory', inventorySchema);
