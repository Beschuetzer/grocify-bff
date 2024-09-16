import mongoose, { Schema } from "mongoose";
import { string } from "zod";

const storeSchema = new mongoose.Schema({
    /**
    *This a UUID v4 that the front end creates
    **/
    _id: String,
    addedDate: Number,
    addressLineOne: String,
    addressLineTwo: String,
    city: String,
    country: String,
    state: String,
    zipCode: String,
    gpsCoordinates: { type: Schema.Types.Mixed },
    name: String,
    userId: { type: Schema.Types.ObjectId, ref: 'User' }
});

export const StoreSchema = mongoose.model("Store", storeSchema);