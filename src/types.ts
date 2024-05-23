import mongoose from "mongoose"

export type ErrorMessage = {
    errorResponse: {
        errmsg: string
    }
}

/**
*Need to update User schema if changes made here
**/
export type User = {
    email: string;
    password: string;
    hasPaid: boolean;
}
export type UserDocument = mongoose.Document & User
