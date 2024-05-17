import { BCRYPT_SALT_ROUND } from "../constants";
import bcrypt from "bcrypt";
import { User } from "../schema/user";
import { ErrorMessage } from "../types";
import { Response } from "express";

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

export function handleError(res: Response, error: unknown) {
  res.status(500).send({error})
}

export function hashPassword(password: string, onEncryption: (err?: Error, hash?: string) => void) {
  bcrypt.hash(password, BCRYPT_SALT_ROUND, function (err, hash) {
    if (err) throw err;
    onEncryption(err, hash);
  });
}

export async function findUser(email: string) {
  const user = await User.findOne({email})
  
  if (!user) {
    throw {error: {
      errorResponse: {
        errmsg: `No user with email of ${email} found`
      }
    }} as ErrorMessage;
  }

  return user;
}