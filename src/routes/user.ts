import express from "express";
import {
  comparePasswords,
  findUser as getUserOrThrow,
  hashPassword,
  handleError,
} from "../helpers";
import { User } from "../schema/user";

const router = express.Router({
  mergeParams: true,
});

router.post("/user", async (req, res) => {
  const { email, password } = req.body;
  hashPassword(password, async function (err, hash) {
    if (err) {
      res.status(500).send({ err });
      return;
    }

    const createdUser = new User({ email, password: hash, hasPaid: false });
    try {
      const savedUser = await createdUser.save();
      res.send({
        savedUser,
      });
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

router.get("/user/checkIfEmailUsed/:email", async (req, res) => {
  const { email } = req.params;
  try {
    const user = await getUserOrThrow(email);
    console.log({ email, user });
    res.send(true);
  } catch (error) {
    res.send(false);
  }
});

export default router;
