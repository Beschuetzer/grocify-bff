import mongoose, { Schema } from "mongoose";

const storeSpecificValuesSchema = new mongoose.Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', unique: true },
    /**
    *The value field need to be the 2nd field given since the index is being referenced in {@link valueFieldIndex},
    **/
    values: { type: Schema.Types.Mixed }
});
const valueFieldIndex = 1;
export const storeSpecificValuesSchemaValueFieldName = Object.keys(storeSpecificValuesSchema.paths)[valueFieldIndex];
export const StoreSpecificValuesSchema = mongoose.model("StoreSpecificValues", storeSpecificValuesSchema);