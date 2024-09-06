import express, { Request, Response } from "express";
import {
  getUserStores,
  getStoreOrThrow,
  handleError,
  getAndThenCacheUser,
  sanitizeKey,
} from "../helpers";
import { STORE_PATH, USER_PATH } from "./constants";
import { DeleteManyRequest, SaveStoreRequest } from "../types";
import { checkIsAuthorized } from "../middlware/isAuthenticated";
import { StoreSchema } from "../schema/store";

const router = express.Router({
  mergeParams: true,
});

router.get(`${STORE_PATH}/:id`, async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const foundItem = await getStoreOrThrow(id);
    res.send(foundItem);
  } catch (error) {
    handleError(res, error);
  }
});

router.get(
  `${STORE_PATH}${USER_PATH}/:userId`,
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      console.log({userId});
      const items = await getUserStores(userId);
      res.send(items);
    } catch (error) {
      handleError(res, error);
    }
  }
);

router.post(`${STORE_PATH}`, async (req: Request, res: Response) => {
  try {
    const { store, userId, password } = req.body as SaveStoreRequest;
    console.log({ method: "POST", userId, password, store });
    const user = await getAndThenCacheUser(userId);
    await checkIsAuthorized(password, user?.password);
    if (store.calculatedDistance) {
      delete store.calculatedDistance;
    }
    const createdStore = new StoreSchema({ ...sanitizeKey(store), userId });
    createdStore._id = store._id;
    const savedStore = await createdStore.save();
    return res.send(savedStore);
  } catch (error) {
    console.log({error});
    return res.status(500).send(false);
  }
});

// router.post(`${ITEM_PATH}/many`, async (req: Request, res: Response) => {
//   const { items, storeSpecificValuesMap, userId, password } = req.body as SaveManyItemsRequest;

//   console.log({method: "POST", userId, password, items, storeSpecificValuesMap});

//   try {
//     const user = await getAndThenCacheUser(userId);
//     await checkIsAuthorized(password, user?.password);
//     // const createdItem = new ItemSchema({ ...item, userId });
//     // createdItem._id = item._id;
//     const savedItems = await ItemSchema.insertMany(items, { ordered: false })

//     console.log({savedItems});

//     //todo: how to handleStoreSpecificValuesMap with many?
//     // if (!savedItem?._id) throw new Error('Unable to obtain an id for the item');
//     // await handleStoreSpecificValuesMap(savedItem?._id, user._id, storeSpecificValuesMap);
//     res.send(savedItems);
//   } catch (error) {
//     handleError(res, error);
//   }
// });

router.delete(`${STORE_PATH}`, async (req: Request, res: Response) => {
  try {
    const { ids, userId, password } = req.body as DeleteManyRequest;
    console.log({ids, userId, password});

    const user = await getAndThenCacheUser(userId);
    await checkIsAuthorized(password, user?.password);
    const deletedItems = await StoreSchema.deleteMany({
      _id: { $in: ids }
    })
    console.log({deletedItems});
    res.send(deletedItems);
  } catch (error) {
    handleError(res, error);
  }
});

export default router;
