import { z } from "zod";

//#region Routes
export const ITEM_PATH = '/item';
export const USER_PATH = '/user';
//#endregion

//#region Zod Schema
export const PASSWORD_SCHEMA = z.string().min(8, 'Password must be at least 8 characters long').refine(
    password => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+[\]{};':"\\|,.<>/?]).{8,}$/.test(password),
    'Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character'
);
//#endregion