import express, { Request, Response } from 'express';
import {
  handleError,
  getLastPurchasedOrThrow,
  getAndThenCacheUser,
} from '../helpers';
import { LAST_PURCHASED } from './constants';
import {
  DeleteValuesDocumentRequest,
  LastPurchasedMap,
  SaveLastPurchasedMapRequest,
} from '../types';
import { checkIsAuthorized } from '../middlware/isAuthenticated';
import { LastPurchasedMapSchema } from '../schema';
import { getUpdateObjectForValuesDocument } from '../helpers/getUpdateObjectForValuesDocument';

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
    const { lastPurchasedMap, userId, password } =
      req.body as SaveLastPurchasedMapRequest;
    console.log({ method: 'POST', userId, password, lastPurchasedMap });
    const user = await getAndThenCacheUser(userId);
    await checkIsAuthorized(password, user?.password);
    const updateObj = getUpdateObjectForValuesDocument<
      LastPurchasedMap,
      LastPurchasedMap[string]
    >(lastPurchasedMap);
    console.log({ updateObj });
    const result = await LastPurchasedMapSchema.findOneAndUpdate(
      { userId },
      updateObj,
      { upsert: true }
    );
    return res.send(result);
  } catch (error) {
    handleError(res, error);
  }
});

router.delete(`${LAST_PURCHASED}`, async (req: Request, res: Response) => {
  try {
    const { userId, password } = req.body as DeleteValuesDocumentRequest;
    console.log({ userId, password });

    const user = await getAndThenCacheUser(userId);
    await checkIsAuthorized(password, user?.password);
    const deletedStores = await LastPurchasedMapSchema.deleteMany({ userId });
    res.send(deletedStores);
  } catch (error) {
    handleError(res, error);
  }
});

export default router;
