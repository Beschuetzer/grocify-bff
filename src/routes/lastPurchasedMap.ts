import express, { Request, Response } from "express";
import {
  handleError,
  getLastPurchasedOrThrow,
  getAndThenCacheUser,
} from "../helpers";
import { LAST_PURCHASED } from "./constants";
import { SaveLastPurchasedMapRequest } from "../types";
import { checkIsAuthorized } from "../middlware/isAuthenticated";
import { StoreSchema } from "../schema/store";
import store from "./store";
import { LastPurchasedMapSchema } from "../schema/lastPurchasedMap";


const router = express.Router({
  mergeParams: true,
});

router.get(`${LAST_PURCHASED}/:userId`, async (req: Request, res: Response) => {
  const { userId } = req.params;
  try {
    const foundItem = await getLastPurchasedOrThrow(userId);
    res.send(foundItem);
  } catch (error) {
    handleError(res, error);
  }
});

router.post(`${LAST_PURCHASED}`, async (req: Request, res: Response) => {
  try {
    const { lastPurchasedMap, userId, password } = req.body as SaveLastPurchasedMapRequest;
    console.log({ method: "POST", userId, password, lastPurchasedMap });
    const user = await getAndThenCacheUser(userId);
    await checkIsAuthorized(password, user?.password);
    const createdStore = new LastPurchasedMapSchema({ values: , userId });
    createdStore._id = store._id;
    const savedStore = await createdStore.save();
    return res.send(savedStore);
  } catch (error) {
    console.log({error});
    return res.status(500).send(false);
  }
});

// router.put(`${LAST_PURCHASED}`, async (req: Request, res: Response) => {
//   try {
//     const { store, userId, password } = req.body as SaveStoreRequest;
//     console.log({ method: "PUT", userId, password, store });
//     const user = await getAndThenCacheUser(userId);
//     await checkIsAuthorized(password, user?.password);
//     const savedStore = await StoreSchema.updateOne(
//       { _id: store._id },
//       {
//         ...sanitizeStore(store),
//       }
//     );
//     return res.send(savedStore);
//   } catch (error) {
//     console.log({error});
//     return res.status(500).send(false);
//   }
// });

// router.delete(`${LAST_PURCHASED}`, async (req: Request, res: Response) => {
//   try {
//     const { ids, userId, password } = req.body as DeleteManyRequest;
//     console.log({ids, userId, password});

//     const user = await getAndThenCacheUser(userId);
//     await checkIsAuthorized(password, user?.password);
//     const deletedStores = await StoreSchema.deleteMany({
//       _id: { $in: ids }
//     })
//     res.send(deletedStores);
//   } catch (error) {
//     handleError(res, error);
//   }
// });

export default router;