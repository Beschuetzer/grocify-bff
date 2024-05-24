import mongoose from "mongoose"

export type CurrentPassword = {
    currentPassword: string;
}

export type ErrorMessage = {
    errorResponse: {
        errmsg: string
    }
}

/**
*Need to update User schema if changes made here
**/
export type UserAccount = {
    email: string;
    password: string;
    hasPaid: boolean;
    _id: string;
}
export type UserDocument = mongoose.Document & UserAccount
