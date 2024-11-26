import TTLCache from '@isaacs/ttlcache';
import { UserDocument } from './types';
import { ProcessGroceryListResponse } from './services/OpenAiClientWrapper';

export const REGISTERED_USERS_CACHE = new TTLCache<string, UserDocument>({
  max: 10000,
  ttl: Infinity,
});

export const OPEN_AI_PROCESS_GROCERY_LISTCACHE = new TTLCache<string, ProcessGroceryListResponse>({
  max: 1000,
  ttl: Infinity,
})