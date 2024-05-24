import express, { Request, Response } from "express";
import {
  hashPassword,
  handleError,
  getAndThenCacheUser,
  getErrorMessage,
} from "../helpers";
import { User } from "../schema/user";
import { REGISTERED_USERS_CACHE as USERS_CACHE } from "../cache";
import { checkIsAuthorized as throwIfNotAuthorized } from "../middlware/isAuthenticated";
import { CurrentPassword, UserAccount, UserDocument } from "../types";

const router = express.Router({
  mergeParams: true,
});

router.post("/user", async (req: Request, res: Response) => {
  const { email, password } = req.body as Pick<
    UserAccount,
    "email" | "password"
  >;

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

router.get("/user/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await getAndThenCacheUser(id);
    res.send(user);
  } catch (error) {
    handleError(res, error);
  }
});

router.delete("/user", async (req: Request, res: Response) => {
  const { password, _id } = req.body as Pick<
    UserAccount,
    "_id" | "password"
  >;

  try {
    const user = await getAndThenCacheUser(_id);
    await throwIfNotAuthorized(password, user.password);
    const deletedUser = await User.deleteOne({ _id });
    if (deletedUser.deletedCount > 0) {
      USERS_CACHE.delete(_id);
    }
    console.log({ deletedUser });
    res.send(deletedUser);
  } catch (error) {
    handleError(res, error);
  }
});

router.put("/user", async (req: Request, res: Response) => {
  const userToUpdate = req.body as UserDocument;
  const { _id, email, password, hasPaid, currentPassword } =
    req.body as UserAccount & CurrentPassword;

  try {
    const user = await getAndThenCacheUser(_id);
    await throwIfNotAuthorized(currentPassword, user.password);
    hashPassword(password || currentPassword, async (err, hash) => {
      try {
        if (err || !hash) {
          res
            .status(500)
            .send(getErrorMessage(`Unable to update user with id of '${_id}'.`));
        }

        console.log({ userToUpdate, user, hash });

        const updatedUser = await User.updateOne(
          { _id },
          {
            ...userToUpdate,
            password: hash,
          }
        );
        console.log({ updatedUser });
        if (updatedUser.modifiedCount > 0) {
          USERS_CACHE.delete(_id);
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

router.get(
  "/user/isEmailAvailable/:email",
  async (req: Request, res: Response) => {
    const { email } = req.params as Pick<UserAccount, "email">;
    try {
      const user = await User.findOne({ email });
      console.log({ user });

      res.send(user?.email !== email);
    } catch (error) {
      handleError(res, error);
    }
  }
);

export default router;
