import { BCRYPT_SALT_ROUND, ERROR_MSG_NOT_AUTHORIZED } from "../constants";
import bcrypt from "bcrypt";
import { UserSchema } from "../schema/user";
import {
  ErrorMessage,
  StoreSpecificValuesMap,
  UserDocument,
} from "../types";
import { Response } from "express";
import { REGISTERED_USERS_CACHE } from "../cache";
import { ItemSchema } from "../schema";
import { ZodEffects } from "zod";
import { StoreSpecificValuesSchema } from "../schema/storeSpecificValues";
import { getUpdateObjectForStoreSpecificValues } from "./getUpdateObjectForStoreSpecificValues";

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
    throw new Error("No id given in getAndThenCacheUser()");
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

export async function getUserItems(userId: string) {
  if (!userId) {
    throw new Error("No userId given in getUserItems().");
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
export async function handleStoreSpecificValues(
  userId: string,
  storeSpecificValuesToAdd?: StoreSpecificValuesMap
) {
  console.log({ storeSpecificValuesToAdd });
  if (Object.keys(storeSpecificValuesToAdd || {}).length <= 0) {
    return;
  }

  const updated = await StoreSpecificValuesSchema.updateOne(
    { userId },
    getUpdateObjectForStoreSpecificValues(storeSpecificValuesToAdd)
  );
  console.log({ updated });

  if (!updated.acknowledged) {
    const newDocument = new StoreSpecificValuesSchema({
      userId,
      values: storeSpecificValuesToAdd,
    });
    try {
      await newDocument.save();
    } catch (error) {
      throw new Error(`Unable to update StoreSpecificValuesSchema document with userId of '${userId}'.`);
    }
  }
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

export function validateMatchesSchema<T>(schema: ZodEffects<any>, item: T) {
  const { success, error } = schema.safeParse(item);

  if (!success) {
    let errorMsg = "Something went wrong parsing the schema";
    if (typeof error === "object") {
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
