import mongoose, { Schema } from "mongoose";

const storeSchema = new mongoose.Schema({
    /**
    *This a UUID v4 that the front end creates
    **/
    _id: String,
    address: { type: Schema.Types.Mixed },
    gpsCoordinates: { type: Schema.Types.Mixed },
    name: {type: String},
});

export const StoreSchema = mongoose.model("Store", storeSchema);