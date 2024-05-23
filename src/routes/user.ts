import express from "express";
import {
  hashPassword,
  handleError,
  getAndThenCacheUser,
  getErrorMessage,
} from "../helpers";
import { User } from "../schema/user";
import { REGISTERED_USERS_CACHE as USERS_CACHE } from "../cache";
import { checkIsAuthorized } from "../middlware/isAuthenticated";
import { UserDocument } from "../types";

const router = express.Router({
  mergeParams: true,
});

router.post("/user", async (req, res) => {
  const { email, password } = req.body;

  hashPassword(password, async function (err, hash) {
    try {
      const createdUser = new User({ email, password: hash, hasPaid: false });
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

router.delete("/user", async (req, res) => {
  const { password, email } = req.body;

  try {
    const user = await getAndThenCacheUser(email);
    console.log({ password, email, user });
    await checkIsAuthorized(password, user.password);
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
  const userToUpdate = req.body as UserDocument;
  const { _id, email, password, hasPaid } = req.body;

  try {
    const user = await getAndThenCacheUser(email);
    const isPasswordSame = await checkIsAuthorized(password, user.password);
    console.log({ isPasswordSame });
    hashPassword(password, async (err, hash) => {
      try {
        if (err || !hash) {
          res
            .status(500)
            .send(getErrorMessage(`Unable to update user with '${email}'.`));
        }
        const updatedUser = await User.updateOne(
          { email },
          {
            ...userToUpdate,
            password: isPasswordSame ? userToUpdate.password : hash,
          }
        );
        console.log({ updatedUser });
        if (updatedUser.modifiedCount > 1) {
          USERS_CACHE.delete(email);
        }
        res.send(updatedUser);
      } catch (error) {
        handleError(res, error);
      }
    });
  } catch (error) {
    handleError(res, error);
  }
});

router.post("/user/isEmailAvailable", async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    res.send(user?.email == email);
  } catch (error) {
    handleError(res, error);
  }
});

export default router;
