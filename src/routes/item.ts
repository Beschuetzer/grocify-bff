import express from "express";
import {
  getAndThenCacheUser,
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
    const user = await getAndThenCacheUser(email);
    const createdItem = new Item({ ...item, email });
    createdItem._id = item._id;
    const savedItem = await createdItem.save();
    res.send({
      savedItem,
    });
  } catch (error) {
    handleError(res, error);
  }
});


export default router;
