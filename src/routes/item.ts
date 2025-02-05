import express, { Request, Response } from 'express';
import {
  getAndThenCacheUser,
  getItemOrThrow,
  getKeyToUse,
  getUserItems,
  handleError,
  handleStoreSpecificValuesMap,
  sanitizeKey,
} from '../helpers';
import { ItemSchema, StoreSpecificValuesSchema } from '../schema';
import { checkIsAuthorized } from '../middlware/isAuthenticated';
import {
  DeleteManyRequest,
  SaveItemRequest,
  SaveManyItemsRequest,
} from '../types';
import { ITEM_PATH, USER_PATH } from './constants';
import { getUnsetObj } from '../helpers/getUnsetObj';
import { S3_CLIENT_WRAPPER } from '../services/S3ClientWrapper';

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

router.get(
  `${ITEM_PATH}${USER_PATH}/:id`,
  async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const items = await getUserItems(id);
      res.send(items);
    } catch (error) {
      handleError(res, error);
    }
  }
);

/**
 *If the originalKey is given, that key will be removed from the {@link StoreSpecificValuesMap}.
 **/
router.post(`${ITEM_PATH}`, async (req: Request, res: Response) => {
  try {
    const { item, storeSpecificValuesMap, userId, password, originalKey } =
      req.body as SaveItemRequest;
    console.log({
      method: 'POST',
      userId,
      password,
      item,
      storeSpecificValuesMap,
    });
    const itemWithUserId = { ...item, userId };
    const user = await getAndThenCacheUser(userId);
    await checkIsAuthorized(password, user?.password);
    const sanitizedItem = sanitizeKey(itemWithUserId);
    const currentItem = await ItemSchema.findById(sanitizedItem._id);
    console.log({ currentItem });
    if (!!currentItem?.userId && currentItem.userId.toString() !== userId) {
      throw new Error('You do not have permission to change this item.');
    }
    const saveItemPromise = ItemSchema.findByIdAndUpdate(
      sanitizedItem._id,
      sanitizedItem,
      { upsert: true }
    );
    const handleStoreSpecificValuesMapPromise = handleStoreSpecificValuesMap(
      sanitizedItem._id,
      user._id,
      storeSpecificValuesMap,
      getKeyToUse(originalKey)
    );
    await Promise.all([saveItemPromise, handleStoreSpecificValuesMapPromise]);
    return res.send(item);
  } catch (error) {
    console.log({ error });
    handleError(res, error, 500);
  }
});

router.post(`${ITEM_PATH}/many`, async (req: Request, res: Response) => {
  const { items, storeSpecificValuesMap, userId, password } =
    req.body as SaveManyItemsRequest;

  console.log({
    method: 'POST',
    userId,
    password,
    items,
    storeSpecificValuesMap,
  });

  try {
    const user = await getAndThenCacheUser(userId);
    await checkIsAuthorized(password, user?.password);
    // const createdItem = new ItemSchema({ ...item, userId });
    // createdItem._id = item._id;
    const savedItems = await ItemSchema.insertMany(items, { ordered: false });

    console.log({ savedItems });

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
    const { ids, userId, password, keys, imagePaths } =
      req.body as DeleteManyRequest;
    console.log({ ids, userId, password, keys, imagePaths });

    const user = await getAndThenCacheUser(userId);
    await checkIsAuthorized(password, user?.password);
    const deletedItems = await ItemSchema.deleteMany({
      _id: { $in: ids?.filter(Boolean) },
      userId: userId,
    });

    const removeImagePromise = S3_CLIENT_WRAPPER.deleteObjs(imagePaths);
    const promises = [removeImagePromise] as Promise<any>[];
    if (deletedItems.deletedCount > 0) {
      if (keys && keys.length > 0) {
        const unsetObject = getUnsetObj(keys);
        const removeStoreSpecificValuesPromise =
          StoreSpecificValuesSchema.updateOne(
            { userId },
            {
              $unset: unsetObject,
            }
          );
        promises.push(removeStoreSpecificValuesPromise);
      }
    }
    await Promise.all(promises);
    res.send(deletedItems);
  } catch (error) {
    handleError(res, error);
  }
});

export default router;
