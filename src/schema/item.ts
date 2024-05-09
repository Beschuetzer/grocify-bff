import mongoose from "mongoose";

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
    lastUpdatedDate: Number,
    name: String,
    unit: String,
    upc: String,
});

export const Item = mongoose.model("Item", itemSchema);