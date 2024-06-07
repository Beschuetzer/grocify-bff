import express, { Request, Response } from "express";
import {
  getAndThenCacheUser,
  getItemOrThrow,
  getUserItems,
  handleError,
  handleStoreSpecificValues,
} from "../helpers";
import { ItemSchema } from "../schema";
import { checkIsAuthorized } from "../middlware/isAuthenticated";
import { SaveItemRequest } from "../types";
import { ITEM_PATH, USER_PATH } from "./constants";

const router = express.Router({
  mergeParams: true,
});

router.get(`${ITEM_PATH}/:id`, async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const foundItem = await getItemOrThrow(id);
    res.send(foundItem);
  } catch (error) {
    handleError(res, error);
  }
});

router.get(`${ITEM_PATH}${USER_PATH}/:id`, async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const items = await getUserItems(id);
    res.send(items);
  } catch (error) {
    handleError(res, error);
  }
});

router.put(`${ITEM_PATH}`, async (req: Request, res: Response) => {
  const { item, storeSpecificValues, password, userId } =
    req.body as SaveItemRequest;

  console.log({method: "PUT", userId, password, item});

  try {
    const user = await getAndThenCacheUser(userId);
    await checkIsAuthorized(password, user?.password);
    await handleStoreSpecificValues(user._id, storeSpecificValues);
    const updatedItem = await ItemSchema.findOneAndUpdate(
      { _id: item._id },
      item
    );
    if (!updatedItem) {
      throw new Error(`No item with id of '${item._id}'.`)
    }
    console.log({updatedItem});
    
    res.send(updatedItem);
  } catch (error) {
    handleError(res, error);
  }
});

router.post(`${ITEM_PATH}`, async (req: Request, res: Response) => {
  const { item, storeSpecificValues, userId, password } = req.body as SaveItemRequest;

  console.log({method: "POST", userId, password, item, storeSpecificValues});

  try {
    const user = await getAndThenCacheUser(userId);
    await checkIsAuthorized(password, user?.password);
    const createdItem = new ItemSchema({ ...item, userId });
    await handleStoreSpecificValues(user._id, storeSpecificValues);
    createdItem._id = item._id;
    const savedItem = await createdItem.save();
    res.send(savedItem);
  } catch (error) {
    handleError(res, error);
  }
});

router.delete(`${ITEM_PATH}`, async (req: Request, res: Response) => {
  const { _id, password } = req.body;
  try {
    const foundItem = await getItemOrThrow(_id);
    const user = await getAndThenCacheUser(foundItem?.userId?.toString());
    await checkIsAuthorized(password, user?.password);
    const deletedItem = await ItemSchema.findOneAndDelete({_id})
    res.send(deletedItem);
  } catch (error) {
    handleError(res, error);
  }
});

export default router;
