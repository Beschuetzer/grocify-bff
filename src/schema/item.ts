import mongoose from "mongoose";

const itemSchema = new mongoose.Schema({
    addedDate: Number,
    /**
     *This is in milliseconds
     **/
    frequency: Number,
    fullscreenImage: String,
    images: [String],
    imageToUseIndex: Number,
    lastUpdatedDate: Number,
    name: String,
    unit: String,
    upc: String,
});

export const Item = mongoose.model("Item", itemSchema);