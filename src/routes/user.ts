import express from "express";
import {
  comparePasswords,
  hashPassword,
  handleError,
  getAndThenCacheUser,
  getErrorMessage,
  getUserOrThrow,
} from "../helpers";
import { User } from "../schema/user";
import { REGISTERED_USERS_CACHE as USERS_CACHE } from "../cache";


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

// router.put("/user/:currentPasswordHash", async (req, res) => {
//   const userToUpdate = req.body;
//   const currentPassword = req.params;
//   const { email, password, hasPaid } = req.body;

//   try {
//     const user = await getAndThenCacheUser(email);

//     comparePasswords(currentPassword, user.password);
//     hashPassword(password, async (err, hash) => {
//       try {
//         if (err || !hash) {
//           res
//             .status(500)
//             .send(getErrorMessage(`Unable to update user with '${email}'.`));
//         }
//         const updatedUser = await User.updateOne({ email }, userToUpdate);
//         console.log({ updatedUser });
//         if (updatedUser.modifiedCount > 1) {
//           USERS_CACHE.delete(email);
//         }
//         res.send(updatedUser);
//       } catch (error) {
//         handleError(res, error);
//       }
//     });
//   } catch (error) {
//     handleError(res, error);
//   }
// });

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
