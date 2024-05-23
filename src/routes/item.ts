import express from "express";
import {
  findUser as getUserOrThrow,
  handleError,
} from "../helpers";
import { Item } from "../schema";

const router = express.Router({
  mergeParams: true,
});

router.post("/item", async (req, res) => {
  const { item, email } = req.body;
  try {
    await getUserOrThrow(email);
    const createdItem = new Item({ ...item, email });
    const savedItem = await createdItem.save();
    res.send({
      savedItem,
    });
  } catch (error) {
    handleError(res, error);
  }
});


export default router;
