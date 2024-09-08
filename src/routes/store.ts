import express, { Request, Response } from "express";
import {
  getUserStores,
  getStoreOrThrow,
  handleError,
  getAndThenCacheUser,
  sanitizeKey,
} from "../helpers";
import { STORE_PATH, USER_PATH } from "./constants";
import { DeleteManyRequest, SaveStoreRequest, Store } from "../types";
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
    const createdStore = new StoreSchema({ ...sanitizeStore(store), userId });
    createdStore._id = store._id;
    const savedStore = await createdStore.save();
    return res.send(savedStore);
  } catch (error) {
    console.log({error});
    return res.status(500).send(false);
  }
});

router.put(`${STORE_PATH}`, async (req: Request, res: Response) => {
  try {
    const { store, userId, password } = req.body as SaveStoreRequest;
    console.log({ method: "PUT", userId, password, store });
    const user = await getAndThenCacheUser(userId);
    await checkIsAuthorized(password, user?.password);
    const savedStore = await StoreSchema.updateOne(
      { _id: store._id },
      {
        ...sanitizeStore(store),
      }
    );
    return res.send(savedStore);
  } catch (error) {
    console.log({error});
    return res.status(500).send(false);
  }
});

router.delete(`${STORE_PATH}`, async (req: Request, res: Response) => {
  try {
    const { ids, userId, password } = req.body as DeleteManyRequest;
    console.log({ids, userId, password});

    const user = await getAndThenCacheUser(userId);
    await checkIsAuthorized(password, user?.password);
    const deletedStores = await StoreSchema.deleteMany({
      _id: { $in: ids }
    })
    res.send(deletedStores);
  } catch (error) {
    handleError(res, error);
  }
});

export default router;

function sanitizeStore(store: Store) {
  const sanitized = sanitizeKey(store);
  if (sanitized.calculatedDistance) {
    delete sanitized.calculatedDistance;
  }
  return sanitized;
}