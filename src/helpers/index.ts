import {
  BCRYPT_SALT_ROUND,
  EMPTY_STRING,
  ERROR_MSG_NOT_AUTHORIZED,
} from '../constants';
import bcrypt from 'bcrypt';
import { UserSchema } from '../schema/user';
import {
  ErrorMessage,
  Key,
  StoreSpecificValuesMap,
  UserDocument,
} from '../types';
import { Response } from 'express';
import { REGISTERED_USERS_CACHE } from '../cache';
import { ItemSchema } from '../schema';
import { ZodEffects } from 'zod';
import { StoreSpecificValuesSchema } from '../schema/storeSpecificValues';
import { StoreSchema } from '../schema/store';
import { LastPurchasedMapSchema } from '../schema/lastPurchasedMap';
import { getUpdateObjectForValuesDocument } from './getUpdateObjectForValuesDocument';
import { getUnsetObj } from './getUnsetObj';

/**
 * Generate a random number between min (inclusive) and max (inclusive)
 * @param min - the smallest value to return (inclusive)
 * @param max - the largest value to return (inclusive)
 **/
export function getRandomInt(min: number, max: number) {
  if (min > max) {
    return min;
  }

  const randomNumber = Math.random();

  let randomInt = min + Math.floor(Math.random() * max);
  if (randomNumber > 0.5) {
    randomInt = min + Math.ceil(Math.random() * max);
  }
  return randomInt;
}

export function comparePasswords(
  password: string,
  hash: string,
  onDecryption: (err?: Error, same?: boolean) => void
) {
  bcrypt.compare(password, hash, function (err, same) {
    if (err) throw err;
    onDecryption(err, same);
  });
}

/**
 *This will throw if the call to {@link getUserOrThrow} throws
 **/
export async function getAndThenCacheUser(id?: string) {
  if (!id) {
    throw new Error('No id given in getAndThenCacheUser()');
  }

  const userFound = REGISTERED_USERS_CACHE.get(id);

  if (!!userFound) {
    return userFound;
  }
  const fetchedUser = await getUserOrThrow(id);
  if (fetchedUser._id === id) {
    REGISTERED_USERS_CACHE.set(id, fetchedUser);
  }
  return fetchedUser;
}

export function getErrorMessage(msg: string) {
  return {
    errorResponse: {
      message: msg,
    },
  } as ErrorMessage;
}

export async function getItemOrThrow(id: string) {
  const user = await ItemSchema.findById(id);

  if (!user) {
    throw getErrorMessage(`No item with id of '${id}' found.`);
  }

  return user;
}

export function getKeyToUse(key?: string | Key) {
  if (!key) return EMPTY_STRING;
  if (typeof key === 'string') return key;
  const sanitizedKey = sanitizeKey(key);
  return sanitizedKey?.upc || sanitizedKey?.name || EMPTY_STRING;
}

export async function getLastPurchasedOrThrow(userId: string) {
  const lastPurchased = await LastPurchasedMapSchema.findOne({ userId });

  if (!lastPurchased) {
    throw getErrorMessage(
      `No lastPurchasedMap associated with userId of '${userId}'.`
    );
  }

  return lastPurchased;
}

export async function getStoreOrThrow(id: string) {
  const store = await StoreSchema.findById(id);

  if (!store) {
    throw getErrorMessage(`No store with id of '${id}' found.`);
  }

  return store;
}

export async function getUserItems(userId: string) {
  if (!userId) {
    throw new Error('No userId given in getUserItems().');
  }

  const items = await ItemSchema.find({ userId });
  return items;
}

export async function getUserOrThrow(id: string) {
  const user = (await UserSchema.findById(id)) as UserDocument;

  if (!user) {
    throw getErrorMessage(`No user with id of '${id}' found`);
  }

  return user;
}

export async function getUserStores(userId: string) {
  if (!userId) {
    throw new Error('No userId given in getUserStores().');
  }

  const stores = await StoreSchema.find({ userId });
  return stores;
}

export function handleError(res: Response, error: unknown, statusCode = 500) {
  let statusCodeToUse = statusCode;
  let errorToUse = error;
  let message = (error as ErrorMessage)?.errorResponse?.message;
  console.log({ errorMsg: (error as any)?.message, message });

  if ((error as Error)?.message) {
    message = (error as Error)?.message;
    errorToUse = getErrorMessage(message);
  }

  if (message === ERROR_MSG_NOT_AUTHORIZED) {
    statusCodeToUse = 401;
  }
  res.status(statusCodeToUse).send(errorToUse);
}

/**
 *Saves the storesSpecific values either as a new document or updates the current document if found
 **/
export async function handleStoreSpecificValuesMap(
  itemId: string,
  userId: string,
  storeSpecificValuesToAdd?: StoreSpecificValuesMap,
  originalKey?: string
) {
  console.log({ itemId, userId, storeSpecificValuesToAdd });
  const keys = Object.keys(storeSpecificValuesToAdd || {});
  if (keys.length <= 0) {
    return;
  }

  const updateObj = getUpdateObjectForValuesDocument<
    StoreSpecificValuesMap,
    StoreSpecificValuesMap[string]
  >(storeSpecificValuesToAdd);
  let objToUse = { ...updateObj };
  if (originalKey) {
    objToUse = {
      ...objToUse,
      $unset: getUnsetObj([originalKey]),
    };
  }
  const updated = await StoreSpecificValuesSchema.findOneAndUpdate(
    { userId: userId.toString() },
    objToUse,
    { upsert: true }
  );
  console.log({ updated, updateObj, objToUse });
  return updated;
}

export function hashPassword(
  password: string,
  onEncryption: (err?: Error, hash?: string) => void
) {
  bcrypt.hash(password, BCRYPT_SALT_ROUND, function (err, hash) {
    if (err) throw err;
    onEncryption(err, hash);
  });
}

/**
 *Use this to ensure that the keys saved are free of invalid characters
 *`.` is not a valid character due to how Mongoose.updateMany and {@link getUpdateObjectForStoreSpecificValues} work.
 **/
export function sanitizeKey<T extends Key>(key: T) {
  const copy = { ...key };
  if (copy?.name) {
    copy.name = sanitize(copy.name);
  }
  if (copy?.upc) {
    copy.upc = sanitize(copy.upc);
  }
  return copy;
}

/**
 *This is used to sanitize the keys used in documents with a values field (e.g. LastPurchasedMapSchema and StoreSpecificValuesSchema)
 **/
export function sanitize(str?: string) {
  if (!str) return '';
  return str?.replace(/\./g, '').trim();
}

export function validateMatchesSchema<T>(schema: ZodEffects<any>, item: T) {
  const { success, error } = schema.safeParse(item);

  if (!success) {
    let errorMsg = 'Something went wrong parsing the schema';
    if (typeof error === 'object') {
      const errorToUse =
        error.errors.find((err) => err.code.match(/custom/i)) ||
        error.errors[0];
      errorMsg = errorToUse.message;
    }
    throw new Error(errorMsg);
  }
}

export async function wait(ms: number) {
  if (ms <= 0) return null;
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(null);
    }, ms);
  });
}
