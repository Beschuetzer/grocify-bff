import mongoose from "mongoose";

/**
*Any new fields should be added to {@link User} in types.
**/
const user = new mongoose.Schema({
    email: { type: String, required: true, unique: true},
    password: { type: String, required: true },
    hasPaid: Boolean,
});

export const User = mongoose.model("User", user);