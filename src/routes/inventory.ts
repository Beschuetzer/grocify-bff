import express, { Request, Response } from 'express';
import {
  getAndThenCacheUser,
  getInventoryOrThrow,
  handleError,
} from '../helpers';
import { INVENTORY_PATH } from './constants';
import { checkIsAuthorized } from '../middlware/isAuthenticated';
import {
  InventoryLocation,
  SaveInventoryLocationRequest,
  UpdateInventoryLocationRequest,
} from '../types';
import {
  inventoryLocationsFieldName,
  InventorySchema,
} from '../schema/inventory';

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
 * For the case when we need to add a new inventory location to the db.
 **/
router.post(
  `${INVENTORY_PATH}/locations`,
  async (req: Request, res: Response) => {
    try {
      const { locations, userId, password } =
        req.body as SaveInventoryLocationRequest;

      validateLocations(locations);
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
 * For the case when we need to update an existing inventory location in the db.
 **/
router.put(
  `${INVENTORY_PATH}/locations`,
  async (req: Request, res: Response) => {
    try {
      const { locations, userId, password } =
        req.body as UpdateInventoryLocationRequest;

      validateLocations(locations);
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

export default router;

function validateLocations(locations: InventoryLocation[]) {
  if (!locations || locations.length === 0) {
    throw new Error('No locations given.');
  }
  for (const loc of locations) {
    if (!loc.name) {
      throw new Error('All locations must have a name.');
    } else if (!loc._id) {
      throw new Error('All locations must have an id.');
    }
  }
}
