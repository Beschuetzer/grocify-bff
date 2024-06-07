import mongoose, { Schema } from "mongoose";
import { StoreSpecificValueKey } from "../types";

const storeSpecificValuesSchema = new mongoose.Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', unique: true },
    values: { type: Schema.Types.Mixed }
});

export const StoreSpecificValuesSchema = mongoose.model("StoreSpecificValues", storeSpecificValuesSchema);