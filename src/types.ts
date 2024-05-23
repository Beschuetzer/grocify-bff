import mongoose from "mongoose"

export type ErrorMessage = {
    error: {
        errorResponse: {
            errmsg: string
        }
    }
}

export type User = {
    email: string;
    hashedPassword: string;
    hasPaid: boolean;
}
export type UserDocument = mongoose.Document & User
