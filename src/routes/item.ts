import express, { Request, Response } from "express";
import {
  getAndThenCacheUser,
  getItemOrThrow,
  handleError,
} from "../helpers";
import { Item } from "../schema";

const router = express.Router({
  mergeParams: true,
});

router.get("/item/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const foundItem = await getItemOrThrow(id);
    res.send({
      foundItem,
    });
  } catch (error) {
    handleError(res, error);
  }
});

router.put("/item/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const foundItem = await getItemOrThrow(id);
    res.send({
      foundItem,
    });
  } catch (error) {
    handleError(res, error);
  }
});


router.post("/item", async (req: Request, res: Response) => {
  const { item, userId } = req.body;
  try {
    await getAndThenCacheUser(userId);
    const createdItem = new Item({ ...item, userId });
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
