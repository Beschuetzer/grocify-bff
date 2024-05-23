import { BCRYPT_SALT_ROUND } from "../constants";
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
export async function getAndThenCacheUser(email: string) {
  const userFound = REGISTERED_USERS_CACHE.get(email);
  if (!!userFound) {
    return userFound;
  } 
  const fetchedUser = await getUserOrThrow(email)
  if (fetchedUser.email === email) {
    REGISTERED_USERS_CACHE.set(email, fetchedUser);
  }
  return fetchedUser;
}

export function getErrorMessage(msg: string) {
  return {
    error: {
      errorResponse: {
        errmsg: msg,
      }
    }
  } as ErrorMessage
}

export async function getItemOrThrow(id: string) {
  const user = await Item.findById(id);
  
  if (!user) {
    throw {error: {
      errorResponse: {
        errmsg: `No user with id of '${id}' found.`
      }
    }} as ErrorMessage;
  }

  return user;
}

export async function getUserOrThrow(email: string) {
  const user = await User.findOne({email}) as UserDocument;
  
  if (!user) {
    throw {error: {
      errorResponse: {
        errmsg: `No user with email of '${email}' found`
      }
    }} as ErrorMessage;
  }

  return user;
}

export function handleError(res: Response, error: unknown) {
  res.status(500).send({error})
}

export function hashPassword(password: string, onEncryption: (err?: Error, hash?: string) => void) {
  bcrypt.hash(password, BCRYPT_SALT_ROUND, function (err, hash) {
    if (err) throw err;
    onEncryption(err, hash);
  });
}