import express, { Request, Response } from "express";
import {
  getAndThenCacheUser,
  getItemOrThrow,
  getUserItems,
  handleError,
  handleStoreSpecificValuesMap,
} from "../helpers";
import { ItemSchema } from "../schema";
import { checkIsAuthorized } from "../middlware/isAuthenticated";
import { DeleteManyRequest, SaveItemRequest } from "../types";
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
  const { item, storeSpecificValuesMap, password, userId } =
    req.body as SaveItemRequest;

  console.log({method: "PUT", userId, password, item});

  try {
    const user = await getAndThenCacheUser(userId);
    await checkIsAuthorized(password, user?.password);
    const updatedItem = await ItemSchema.findOneAndUpdate(
      { _id: item._id },
      item
    );
    if (!updatedItem) {
      throw new Error(`No item with id of '${item._id}'.`)
    }
    await handleStoreSpecificValuesMap(item._id, user._id, storeSpecificValuesMap);
    console.log({updatedItem});
    
    res.send(updatedItem);
  } catch (error) {
    handleError(res, error);
  }
});

router.post(`${ITEM_PATH}`, async (req: Request, res: Response) => {
  const { item, storeSpecificValuesMap, userId, password } = req.body as SaveItemRequest;

  console.log({method: "POST", userId, password, item, storeSpecificValuesMap});

  try {
    const user = await getAndThenCacheUser(userId);
    await checkIsAuthorized(password, user?.password);
    const createdItem = new ItemSchema({ ...item, userId });
    createdItem._id = item._id;
    const savedItem = await createdItem.save();

    if (!savedItem?._id) throw new Error('Unable to obtain an id for the item');

    await handleStoreSpecificValuesMap(savedItem?._id, user._id, storeSpecificValuesMap);
    res.send(savedItem);
  } catch (error) {
    handleError(res, error);
  }
});

router.delete(`${ITEM_PATH}`, async (req: Request, res: Response) => {
  try {
    const { ids, userId, password } = req.body as DeleteManyRequest;
    console.log({ids, userId, password});
    
    const user = await getAndThenCacheUser(userId);
    await checkIsAuthorized(password, user?.password);
    const deletedItems = await ItemSchema.deleteMany({
      _id: { $in: ids }
    })
    if (deletedItems.deletedCount > 0) {
      console.log("need to clean up ");
      // ids.map
      // for (const id of ids) {
      // }

      // await StoreSpecificValuesSchema.updateOne({userId}, {
      //   $unset: {[`${}`]}
      // })
    }
    res.send(deletedItems);
  } catch (error) {
    handleError(res, error);
  }
});

export default router;
