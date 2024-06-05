import mongoose from "mongoose";

/**
*Any new fields should be added to {@link UserSchema} in types.
**/
const user = new mongoose.Schema({
    email: { type: String, required: true, unique: true},
    password: { type: String, required: true },
});

export const UserSchema = mongoose.model("User", user);