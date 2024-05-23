import TTLCache from "@isaacs/ttlcache";
import { UserDocument } from "./types";

export const REGISTERED_USERS_CACHE = new TTLCache<string, UserDocument>({
    max: 1000,
    ttl: Infinity
});