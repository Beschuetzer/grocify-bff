import express, { Request, Response } from 'express';
import {
  getUserStores,
  getStoreOrThrow,
  handleError,
  getAndThenCacheUser,
  sanitizeKey,
} from '../helpers';
import { STORE_PATH, USER_PATH } from './constants';
import { DeleteManyRequest, SaveStoreRequest, Store } from '../types';
import { checkIsAuthorized } from '../middlware/isAuthenticated';
import {
  StoreSchema,
  StoreSpecificValuesSchema,
  storeSpecificValuesSchemaValueFieldName,
} from '../schema';
import { getUnsetObj } from '../helpers/getUnsetObj';

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
      console.log({ userId });
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
    console.log(''.padEnd(100, '-'));
    console.log({ method: 'POST', userId, password, store });
    const user = await getAndThenCacheUser(userId);
    await checkIsAuthorized(password, user?.password);

    const sanitizedStore = sanitizeStore(store);
    const updateStorePromise = StoreSchema.findByIdAndUpdate(
      store._id,
      { ...sanitizedStore, userId },
      { upsert: true }
    );
    const updateStoreSpecificValuesPromise = StoreSpecificValuesSchema.findOne({
      userId,
    });
    const [storeResult, storeSpecificValuesResult] = await Promise.all([
      updateStorePromise,
      updateStoreSpecificValuesPromise,
    ]);

    //update the storeSpecificValues to reflect any change
    if (
      (storeSpecificValuesResult as any)?.[
        storeSpecificValuesSchemaValueFieldName
      ] &&
      storeResult?.addressLineOne !== sanitizedStore.name
    ) {
      const updateObj = {} as Record<string, any>;
      const unsetKeys = [];
      for (const [key, values] of Object.entries(
        (storeSpecificValuesResult as any)?.[
          storeSpecificValuesSchemaValueFieldName
        ] || {}
      )) {
        for (const [
          storeSpecificValueName,
          storeSpecificValue,
        ] of Object.entries(values || {})) {
          for (const [storeName, storeValue] of Object.entries(
            storeSpecificValue || {}
          )) {
            if (
              storeName === storeResult?.addressLineOne &&
              sanitizedStore?.addressLineOne
            ) {
              const keyToUse = `${storeSpecificValuesSchemaValueFieldName}.${key}.${storeSpecificValueName}.${sanitizedStore.addressLineOne}`;
              const valueToUse = storeValue;
              console.log(`Setting ${keyToUse} to ${valueToUse}`);
              updateObj[keyToUse] = valueToUse;

              if (
                (storeSpecificValuesResult as any)?.[
                  storeSpecificValuesSchemaValueFieldName
                ]?.[key]?.[storeSpecificValueName]
              ) {
                console.log(
                  `Adding ${key}.${storeSpecificValueName}.${storeName} to the unsetKeys`
                );
                unsetKeys.push(`${key}.${storeSpecificValueName}.${storeName}`);
              }
            }
          }
        }
      }
      const unsetObj = getUnsetObj(unsetKeys);
      await StoreSpecificValuesSchema.findOneAndUpdate(
        { userId },
        {
          ...updateObj,
          $unset: unsetObj,
        },
        { upsert: true }
      );
    }
    return res.send(store);
  } catch (error) {
    console.log({ error });
    return res.status(500).send(false);
  }
});

router.delete(`${STORE_PATH}`, async (req: Request, res: Response) => {
  try {
    const { ids, userId, password } = req.body as DeleteManyRequest;
    console.log({ ids, userId, password });

    const user = await getAndThenCacheUser(userId);
    await checkIsAuthorized(password, user?.password);
    const deletedStores = await StoreSchema.deleteMany({
      _id: { $in: ids?.filter(Boolean) },
    });
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
