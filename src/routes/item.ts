import express, { Request, Response } from "express";
import {
  getAndThenCacheUser,
  getItemOrThrow,
  getUserItems,
  handleError,
  handleStoreSpecificValuesMap,
  sanitizeKey,
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
  try {
    const { item, storeSpecificValuesMap, userId, password } = req.body as SaveItemRequest;
    console.log({method: "POST", userId, password, item, storeSpecificValuesMap});
    const itemWithUserId = { ...item, userId }
    const user = await getAndThenCacheUser(userId);
    await checkIsAuthorized(password, user?.password);
    const sanitizedItem = sanitizeKey(itemWithUserId)
    const saveItemPromise = ItemSchema.findByIdAndUpdate( sanitizedItem._id, sanitizedItem, { upsert: true })
    const handleStoreSpecificValuesMapPromise = handleStoreSpecificValuesMap(sanitizedItem._id, user._id, storeSpecificValuesMap);
    await Promise.all([
      saveItemPromise,
      handleStoreSpecificValuesMapPromise
    ])
    return res.send(item);
  } catch (error) {
    console.log({error});
    return res.status(500).send(null);
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
    const { ids, userId, password, keys } = req.body as DeleteManyRequest;
    console.log({ ids, userId, password, keys });
    
    const user = await getAndThenCacheUser(userId);
    await checkIsAuthorized(password, user?.password);
    const deletedItems = await ItemSchema.deleteMany({
      _id: { $in: ids?.filter(Boolean) }
    })
    if (deletedItems.deletedCount > 0 && keys && keys.length > 0) {
      console.log("need to clean up ");
      const unsetObject = getUnsetObj(keys);
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