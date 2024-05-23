import express from "express";
import {
  comparePasswords,
  findUser as getUserOrThrow,
  hashPassword,
  handleError,
  getAndThenCacheUser,
  getErrorMessage,
} from "../helpers";
import { User } from "../schema/user";
import { REGISTERED_USERS_CACHE as USERS_CACHE } from "../cache";
import { User as UserType } from "../types";
import mongoose from "mongoose";

const router = express.Router({
  mergeParams: true,
});

router.post("/user", async (req, res) => {
  const { email, password } = req.body;

  hashPassword(password, async function (err, hash) {
    try {
      const createdUser = new User({ email, password: hash, hasPaid: false });
      createdUser._id = email;
      const savedUser = await createdUser.save();
      res.send({
        savedUser,
      });
    } catch (error) {
      handleError(res, error);
    }
  });
});

router.get("/user/:email", async (req, res) => {
  try {
    const { email } = req.params;
    const user = await getAndThenCacheUser(email);
    res.send(user);
  } catch (error) {
    handleError(res, error);
  }
});

router.delete("/user/:email", async (req, res) => {
  //todo: invalidate cache entry
  const { email } = req.params;
  try {
    const deletedUser = await User.deleteOne({ email });
    if (deletedUser.deletedCount > 0) {
      USERS_CACHE.delete(email);
    }
    console.log({ deletedUser });
    res.send(deletedUser);
  } catch (error) {
    handleError(res, error);
  }
});

router.put("/user", async (req, res) => {
  const { email, password, hasPaid } = req.body;
  hashPassword(password, async (err, hash) => {
    try {
        if (!hash) {
            res.status(500).send(getErrorMessage(`Unable to hash password for '${email}'.`))
        }

        const user = await getAndThenCacheUser(email) as UserType & mongoose.Document;
        user.email = email;
        user.hashedPassword = hash as string;
        user.hasPaid = hasPaid;
        const savedUser = await user.save();
        USERS_CACHE.set(email, savedUser);
        res.send(savedUser)
    } catch (error) {
      handleError(res, error);
    }
  });
});

router.post("/user/isPasswordSame", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await getUserOrThrow(email);
    comparePasswords(password, user.password, function (err, isSame) {
      res.send(isSame);
      return;
    });
  } catch (error) {
    handleError(res, error);
  }
});

export default router;
