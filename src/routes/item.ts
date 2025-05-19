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
import { InventorySchema } from '../schema/inventory';

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
  const session = await InventorySchema.startSession();
  try {
    const { ids, userId, password, keys, imagePaths } =
      req.body as DeleteManyRequest;

    const user = await getAndThenCacheUser(userId);
    await checkIsAuthorized(password, user?.password);

    // Start a transaction.
    session.startTransaction();

    // Delete the items from the ItemSchema collection.
    const deletedItems = await ItemSchema.deleteMany({
      _id: { $in: ids?.filter(Boolean) },
      userId: userId,
    }).session(session);

    // Build a bulk operation to update the InventorySchema document.
    const bulkOps = [
      {
        updateOne: {
          filter: { userId },
          update: [
            {
              $set: {
                items: {
                  $arrayToObject: {
                    $map: {
                      input: { $objectToArray: '$items' },
                      as: 'location',
                      in: {
                        k: '$$location.k',
                        v: {
                          $arrayToObject: {
                            $filter: {
                              input: { $objectToArray: '$$location.v' },
                              as: 'itemEntry',
                              cond: {
                                $not: {
                                  $in: ['$$itemEntry.k', ids.filter(Boolean)],
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          ],
        },
      },
    ];

    await InventorySchema.bulkWrite(bulkOps, { session });

    // If there are store specific values to remove, update that document.
    if (deletedItems.deletedCount > 0 && keys && keys.length > 0) {
      const unsetObject = getUnsetObj(keys);
      await StoreSpecificValuesSchema.updateOne(
        { userId },
        {
          $unset: unsetObject,
        },
        { session }
      );
    }

    // Commit the transaction.
    await session.commitTransaction();
    session.endSession();

    // Now, call S3 deletion outside the transaction.
    await S3_CLIENT_WRAPPER.deleteObjs(imagePaths);

    res.send(deletedItems);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    handleError(res, error);
  }
});

export default router;
