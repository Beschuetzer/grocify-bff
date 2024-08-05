import express, { Request, Response } from "express";
import {
  getAndThenCacheUser,
  getItemOrThrow,
  getUserItems,
  handleError,
  handleStoreSpecificValuesMap,
  sanitizeItem,
} from "../helpers";
import { ItemSchema } from "../schema";
import { checkIsAuthorized } from "../middlware/isAuthenticated";
import { DeleteManyRequest, SaveItemRequest, SaveManyItemsRequest } from "../types";
import { ITEM_PATH, USER_PATH } from "./constants";
import { StoreSpecificValuesSchema } from "../schema/storeSpecificValues";
import { getUnsetObj } from "../helpers/getUnsetObj";

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

router.post(`${ITEM_PATH}`, async (req: Request, res: Response) => {
  const { item, storeSpecificValuesMap, userId, password } = req.body as SaveItemRequest;

  console.log({method: "POST", userId, password, item, storeSpecificValuesMap});

  try {
    const user = await getAndThenCacheUser(userId);
    await checkIsAuthorized(password, user?.password);
    const createdItem = new ItemSchema({ ...sanitizeItem(item), userId });
    createdItem._id = item._id;
    const saveItemsPromise = ItemSchema.findByIdAndUpdate(item._id, item, { upsert: true })
    const handleStoreSpecificValuesMapPromise = handleStoreSpecificValuesMap(createdItem._id, user._id, storeSpecificValuesMap);
    const resolvedPromises = await Promise.race([
      saveItemsPromise,
      handleStoreSpecificValuesMapPromise
    ])
    return res.send(true);
  } catch (error) {
    console.log({error});
    return res.status(500).send(false);
  }
});

router.post(`${ITEM_PATH}/many`, async (req: Request, res: Response) => {
  const { items, storeSpecificValuesMap, userId, password } = req.body as SaveManyItemsRequest;

  console.log({method: "POST", userId, password, items, storeSpecificValuesMap});

  try {
    const user = await getAndThenCacheUser(userId);
    await checkIsAuthorized(password, user?.password);
    // const createdItem = new ItemSchema({ ...item, userId });
    // createdItem._id = item._id;
    const savedItems = await ItemSchema.insertMany(items, { ordered: false })

    console.log({savedItems});

    //todo: how to handleStoreSpecificValuesMap with many?
    // if (!savedItem?._id) throw new Error('Unable to obtain an id for the item');
    // await handleStoreSpecificValuesMap(savedItem?._id, user._id, storeSpecificValuesMap);
    res.send(savedItems);
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
      const unsetObject = getUnsetObj(ids);
      console.log({unsetObject});
      await StoreSpecificValuesSchema.updateOne({userId}, {
        $unset: unsetObject
      })
    }
    res.send(deletedItems);
  } catch (error) {
    handleError(res, error);
  }
});

export default router;