import mongoose, { Schema } from "mongoose";

const lastPurchasedMapSchema = new mongoose.Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', unique: true },
    /**
    *The value field need to be the 2nd field given since the index is being referenced in {@link valueFieldIndex},
    **/
    values: { type: Schema.Types.Mixed }
});
const valueFieldIndex = 1;
export const lastPurchasedMapSchemaValueFieldName = Object.keys(lastPurchasedMapSchema.paths)[valueFieldIndex];
export const LastPurchasedMapSchema = mongoose.model("LastPurchasedMap", lastPurchasedMapSchema);