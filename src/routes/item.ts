import express, { Request, Response } from "express";
import {
  getAndThenCacheUser,
  getItemOrThrow,
  handleError,
} from "../helpers";
import { Item } from "../schema";
import { checkIsAuthorized } from "../middlware/isAuthenticated";

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

//todo: finish this
router.put("/item/", async (req: Request, res: Response) => {
  const { _id, item } = req.body;
  try {
    const foundItem = await getItemOrThrow(_id);
    res.send({
      foundItem,
    });
  } catch (error) {
    handleError(res, error);
  }
});


router.post("/item", async (req: Request, res: Response) => {
  const { item, userId, password } = req.body;
  try {
    const user = await getAndThenCacheUser(userId);
    await checkIsAuthorized(password, user.password);
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
