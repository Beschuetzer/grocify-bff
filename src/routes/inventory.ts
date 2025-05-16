import express, { Request, Response } from 'express';
import {
  getAndThenCacheUser,
  getInventoryOrThrow,
  handleError,
} from '../helpers';
import { INVENTORY_PATH } from './constants';
import { checkIsAuthorized } from '../middlware/isAuthenticated';
import {
  DeleteInventoryItemsRequest,
  DeleteInventoryLocationRequest,
  InventoryItemExpirationDates,
  MoveInventoryItemsRequest,
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
        validator: (values: InventoryItemExpirationDates) => {
          const now = Date.now();
          for (const [time, quantity] of Object.entries(values)) {
            if (Number(time) < now) {
              return false; // Expiration date is in the past
            }
          }
          return Object.entries(values || {}).length > 0;
        },
      },
    ]);
    const user = await getAndThenCacheUser(userId);
    await checkIsAuthorized(password, user?.password);

    // Build bulk operations for each inventory item
    const bulkOps = inventoryItems.map((item) => {
      const fieldPath = `items.${item.locationId}.${item.itemId}`;
      // Build an update object that increments each key in expirationDates.
      const incObj: { [key: string]: number } = {};
      for (const expKey in item.item.expirationDates) {
        if (
          Object.prototype.hasOwnProperty.call(
            item.item.expirationDates,
            expKey
          )
        ) {
          // Compute the full path for this expiration date field.
          const fullPath = `${fieldPath}.expirationDates.${expKey}`;
          // The value to increment by.
          incObj[fullPath] = item.item.expirationDates[expKey];
        }
      }

      return {
        updateOne: {
          filter: { userId },
          update: { $inc: incObj },
          upsert: true,
        },
      };
    });

    // Execute all update operations in one batch
    const bulkResult = await InventorySchema.bulkWrite(bulkOps);

    return res.send(bulkResult);
  } catch (error) {
    handleError(res, error, 500);
  }
});

/**
 * For the case when we need to add inventory location items to the db.
 **/
router.post(
  `${INVENTORY_PATH}/items/move`,
  async (req: Request, res: Response) => {
    try {
      const { itemsToMove, userId, password } =
        req.body as MoveInventoryItemsRequest;

      console.log({ inventoryItems: itemsToMove });

      validateInventory(itemsToMove, [
        {
          key: 'originLocationId',
          errorMessage: 'All items must have a originLocationId.',
          validator: (value) => value != null,
        },
        {
          key: 'targetLocationId',
          errorMessage: 'All items must have a targetLocationId.',
          validator: (value) => value != null,
        },
        {
          key: 'itemId',
          errorMessage: 'All items must have an itemId.',
          validator: (value) => value != null,
        },
      ]);
      const user = await getAndThenCacheUser(userId);
      await checkIsAuthorized(password, user?.password);

      // Build bulk operations for moving items.
      // For each item, we move the subdocument (the entire inventory item)
      // from the origin location to the target location.
      const bulkOps = itemsToMove.map((item) => {
        const originFieldPath = `items.${item.originLocationId}.${item.itemId}`;
        const targetFieldPath = `items.${item.targetLocationId}.${item.itemId}`;
        return {
          updateOne: {
            filter: { userId },
            update: [
              // Stage 1: Copy the entire subdocument from origin to target.
              { $set: { [targetFieldPath]: `$${originFieldPath}` } },
              // Stage 2: Remove the subdocument from the origin location.
              { $unset: originFieldPath },
            ],
            upsert: true,
          },
        };
      });

      // Execute all update operations in one batch
      const bulkResult = await InventorySchema.bulkWrite(bulkOps);

      return res.send(bulkResult);
    } catch (error) {
      handleError(res, error, 500);
    }
  }
);

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
  `${INVENTORY_PATH}/items`,
  async (req: Request, res: Response) => {
    try {
      const { inventoryItems, userId, password } =
        req.body as DeleteInventoryItemsRequest;

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
          key: 'expirationDates',
          errorMessage:
            'All items must have at least one expiration date (as a number) that is after now.',
          validator: (values: InventoryItemExpirationDates) => {
            const now = Date.now();
            for (const [time, quantity] of Object.entries(values)) {
              if (Number(time) < now) {
                return false; // Expiration date is in the past
              }
            }
            return Object.entries(values || {}).length > 0;
          },
        },
      ]);
      const user = await getAndThenCacheUser(userId);
      await checkIsAuthorized(password, user?.password);

      const bulkOps = inventoryItems.map((item) => {
        const fieldPath = `items.${item.locationId}.${item.itemId}`;
        // The input decrement object – keys map to the amount to subtract.
        const decrementValues = item.expirationDates; // e.g. { "abc": 2, "def": 3 }

        return {
          updateOne: {
            filter: { userId },
            // Use an update pipeline to compute the new expirationDates
            update: [
              {
                $set: {
                  // Recompute the expirationDates object for the item.
                  [`${fieldPath}.expirationDates`]: {
                    $arrayToObject: {
                      $filter: {
                        // Convert expirationDates object to an array and process each entry.
                        input: {
                          $map: {
                            input: {
                              $objectToArray: {
                                $ifNull: [`$${fieldPath}.expirationDates`, {}],
                              },
                            },
                            as: 'entry',
                            in: {
                              k: '$$entry.k',
                              v: {
                                $cond: {
                                  // If the current key is present in decrementValues…
                                  if: {
                                    $in: [
                                      '$$entry.k',
                                      {
                                        $map: {
                                          input: {
                                            $objectToArray: {
                                              $literal: decrementValues,
                                            },
                                          },
                                          as: 'd',
                                          in: '$$d.k',
                                        },
                                      },
                                    ],
                                  },
                                  // ... subtract the corresponding decrement value.
                                  then: {
                                    $subtract: [
                                      '$$entry.v',
                                      {
                                        $arrayElemAt: [
                                          {
                                            $map: {
                                              input: {
                                                $objectToArray: {
                                                  $literal: decrementValues,
                                                },
                                              },
                                              as: 'd',
                                              in: '$$d.v',
                                            },
                                          },
                                          {
                                            $indexOfArray: [
                                              {
                                                $map: {
                                                  input: {
                                                    $objectToArray: {
                                                      $literal: decrementValues,
                                                    },
                                                  },
                                                  as: 'd',
                                                  in: '$$d.k',
                                                },
                                              },
                                              '$$entry.k',
                                            ],
                                          },
                                        ],
                                      },
                                    ],
                                  },
                                  // Otherwise, leave the value unchanged.
                                  else: '$$entry.v',
                                },
                              },
                            },
                          },
                        },
                        as: 'entry',
                        // Only keep entries whose new value is greater than 0.
                        cond: { $gt: ['$$entry.v', 0] },
                      },
                    },
                  },
                },
              },
            ],
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
