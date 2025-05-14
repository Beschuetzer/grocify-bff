import express, { Request, Response } from 'express';
import {
  getAndThenCacheUser,
  getInventoryOrThrow,
  handleError,
} from '../helpers';
import { INVENTORY_PATH } from './constants';
import { checkIsAuthorized } from '../middlware/isAuthenticated';
import {
  DeleteInventoryLocationRequest,
  SaveInventoryItemsRequest,
  SaveInventoryLocationRequest,
  UpdateInventoryLocationRequest,
} from '../types';
import {
  inventoryLocationsFieldName,
  InventorySchema,
} from '../schema/inventory';
import { DEFAULT_LOCATION_VALIDATORS } from '../validation/inventoryLocation';

const router = express.Router({
  mergeParams: true,
});

router.get(`${INVENTORY_PATH}`, async (req: Request, res: Response) => {
  const { userId } = req.params;
  try {
    const foundItem = await getInventoryOrThrow(userId);
    res.send(foundItem);
  } catch (error) {
    handleError(res, error);
  }
});

/**
 * For the case when we need to add inventory location items to the db.
 **/
router.post(`${INVENTORY_PATH}/items`, async (req: Request, res: Response) => {
  try {
    const { inventoryItems, userId, password } =
      req.body as SaveInventoryItemsRequest;

    validateInventory(inventoryItems, [
      {
        key: 'locationId',
        errorMessage: 'All items must have a location id.',
        validator: (value) => value != null,
      },
      {
        key: 'itemId',
        errorMessage: 'All items must have an item id.',
        validator: (value) => value != null,
      },
      {
        key: 'item.expirationDates',
        errorMessage:
          'All items must have at least one expiration date (as a number) that is after now.',
        validator: (values: number[]) => {
          const now = Date.now();
          console.log({ values, now });
          for (const value of values) {
            if (typeof value !== 'number' || value < now) {
              return false; // Expiration date is in the past
            }
          }
          return values.length > 0;
        },
      },
    ]);
    const user = await getAndThenCacheUser(userId);
    await checkIsAuthorized(password, user?.password);

    // Build bulk operations for each inventory item
    const bulkOps = inventoryItems.map((item) => {
      return {
        updateOne: {
          filter: { userId },
          update: {
            $addToSet: {
              [`items.${item.locationId}.${item.itemId}.expirationDates`]: {
                $each: item.item.expirationDates,
              },
            },
          },
          upsert: true,
        },
      };
    });

    // Execute all update operations in one batch
    await InventorySchema.bulkWrite(bulkOps);

    return res.send(bulkOps);
  } catch (error) {
    handleError(res, error, 500);
  }
});

/**
 * For the case when we need to add inventory locations to the db.
 **/
router.post(
  `${INVENTORY_PATH}/locations`,
  async (req: Request, res: Response) => {
    try {
      const { locations, userId, password } =
        req.body as SaveInventoryLocationRequest;

      validateInventory(locations);
      const user = await getAndThenCacheUser(userId);
      await checkIsAuthorized(password, user?.password);
      await InventorySchema.findOneAndUpdate(
        { userId }, // Query to match existing document
        { $addToSet: { locations: { $each: locations } } }, // Adds each location only if it doesn't exist
        { new: true, upsert: true } // Return the new doc and upsert if not found
      );
      return res.send(true);
    } catch (error) {
      handleError(res, error, 500);
    }
  }
);

/**
 * For the case when we need to update existing inventory locations in the db.
 **/
router.put(
  `${INVENTORY_PATH}/locations`,
  async (req: Request, res: Response) => {
    try {
      const { locations, userId, password } =
        req.body as UpdateInventoryLocationRequest;

      validateInventory(locations);
      const user = await getAndThenCacheUser(userId);
      await checkIsAuthorized(password, user?.password);

      // Build an array of update operations for each location
      const bulkOps = locations.map((location) => {
        // Build dynamic update object skipping _id
        const updateFields: any = {};
        Object.keys(location).forEach((key) => {
          if (key !== '_id') {
            updateFields[`${inventoryLocationsFieldName}.$.${key}`] = (
              location as any
            )[key];
          }
        });
        return {
          updateOne: {
            filter: {
              userId,
              [`${inventoryLocationsFieldName}._id`]: location._id,
            },
            update: { $set: updateFields },
            upsert: true,
          },
        };
      });

      const bulkResult = await InventorySchema.bulkWrite(bulkOps);
      return res.send(bulkResult);
    } catch (error) {
      handleError(res, error, 500);
    }
  }
);

router.delete(
  `${INVENTORY_PATH}/locations`,
  async (req: Request, res: Response) => {
    try {
      const { locations, userId, password } =
        req.body as DeleteInventoryLocationRequest;

      validateInventory(locations, [DEFAULT_LOCATION_VALIDATORS[0]]);
      const user = await getAndThenCacheUser(userId);
      await checkIsAuthorized(password, user?.password);
      const locationIds = locations.map((loc) => loc._id).filter(Boolean);

      const unsetObj: { [key: string]: '' } = {};
      locationIds.forEach((id) => {
        unsetObj[`items.${id}`] = '';
      });

      const removeItemsEntriesPromise = InventorySchema.findOneAndUpdate(
        { userId },
        { $unset: unsetObj }
      );

      const removeLocationsPromise = InventorySchema.findOneAndUpdate(
        { userId },
        { $pull: { locations: { _id: { $in: locationIds } } } }
      );

      await Promise.all([removeLocationsPromise, removeItemsEntriesPromise]);

      return res.send(true);
    } catch (error) {
      handleError(res, error, 500);
    }
  }
);

export default router;

function getNestedValue(obj: any, key: string): any {
  return key.split('.').reduce((acc, cur) => (acc ? acc[cur] : undefined), obj);
}

function validateInventory(
  objectsToValidate: object[],
  validators = DEFAULT_LOCATION_VALIDATORS
) {
  if (!objectsToValidate || objectsToValidate.length === 0) {
    throw new Error('No items given to validate in validateInventory.');
  }
  for (const obj of objectsToValidate) {
    if (!obj) continue;
    for (const validator of validators) {
      const { key, errorMessage, validator: validate } = validator;
      const value = getNestedValue(obj, key);
      if (!validate(value)) {
        throw new Error(errorMessage);
      }
    }
  }
}
