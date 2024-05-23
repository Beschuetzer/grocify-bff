import mongoose from "mongoose";

const user = new mongoose.Schema({
    email: { type: String, required: true },
    password: { type: String, required: true },
    hasPaid: Boolean,
    _id: String,
});

export const User = mongoose.model("User", user);