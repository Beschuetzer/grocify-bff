import mongoose, { Schema } from "mongoose";
import { StoreSpecificValueKey } from "../types";

const storeSpecificValuesSchema = new mongoose.Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', unique: true },
    values: {
        [StoreSpecificValueKey.AisleNumber]: Object,
        [StoreSpecificValueKey.IsInCart]: Object,
        [StoreSpecificValueKey.ItemId]: Object,
        [StoreSpecificValueKey.Price]: Object,
        [StoreSpecificValueKey.Quantity]: Object,
    },
});

export const StoreSpecificValuesSchema = mongoose.model("StoreSpecificValues", storeSpecificValuesSchema);