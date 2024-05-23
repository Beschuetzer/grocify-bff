import TTLCache from "@isaacs/ttlcache";
import { User } from "./types";
import { Document } from "mongoose";

export const REGISTERED_USERS_CACHE = new TTLCache<string, Document>({
    max: 1000,
    ttl: Infinity
});