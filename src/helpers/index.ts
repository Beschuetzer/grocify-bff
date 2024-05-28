import { BCRYPT_SALT_ROUND, ERROR_MSG_NOT_AUTHORIZED } from "../constants";
import bcrypt from "bcrypt";
import { User } from "../schema/user";
import { ErrorMessage, UserDocument } from "../types";
import { Response } from "express";
import { REGISTERED_USERS_CACHE } from "../cache";
import { Item } from "../schema";

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

export function comparePasswords(password: string, hash: string, onDecryption: (err?: Error, same?: boolean) => void) {
  bcrypt.compare(password, hash, function (err, same) {
    if (err) throw err;
    onDecryption(err, same);
  });
}

/**
*This will throw if the call to {@link getUserOrThrow} throws
**/
export async function getAndThenCacheUser(id: string) {
  const userFound = REGISTERED_USERS_CACHE.get(id);
  
  if (!!userFound) {
    return userFound;
  } 
  const fetchedUser = await getUserOrThrow(id)
  if (fetchedUser._id === id) {
    REGISTERED_USERS_CACHE.set(id, fetchedUser);
  }
  return fetchedUser;
}

export function getErrorMessage(msg: string) {
  return {
      errorResponse: {
        errmsg: msg,
      }
  } as ErrorMessage
}

export async function getItemOrThrow(id: string) {
  const user = await Item.findById(id);
  
  if (!user) {
    throw getErrorMessage(`No user with id of '${id}' found.`);
  }

  return user;
}

export async function getUserItems(userId: string) {
  if (!userId) {
    throw new Error('No userId given in getUserItems().')
  }
  
  const items = await Item.find({ userId });
  return items;
}

export async function getUserOrThrow(id: string) {
  const user = await User.findById(id) as UserDocument;
  
  if (!user) {
    throw getErrorMessage(`No user with id of '${id}' found`);
  }

  return user;
}

export function handleError(res: Response, error: unknown, statusCode = 500) {
  let statusCodeToUse = statusCode;
  console.log({error});
  
  const message = (error as Error)?.message || (error as ErrorMessage)?.errorResponse?.errmsg;

  if (message === ERROR_MSG_NOT_AUTHORIZED || message === ERROR_MSG_NOT_AUTHORIZED) {
    statusCodeToUse = 401;
  }
  res.status(statusCodeToUse).send(error)
}

export function hashPassword(password: string, onEncryption: (err?: Error, hash?: string) => void) {
  bcrypt.hash(password, BCRYPT_SALT_ROUND, function (err, hash) {
    if (err) throw err;
    onEncryption(err, hash);
  });
}