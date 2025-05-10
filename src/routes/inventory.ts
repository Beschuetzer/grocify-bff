import express, { Request, Response } from 'express';
import {
  getAndThenCacheUser,
  getInventoryOrThrow,
  handleError,
} from '../helpers';
import { INVENTORY_PATH } from './constants';
import { checkIsAuthorized } from '../middlware/isAuthenticated';
import {
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
  `${INVENTORY_PATH}/location`,
  async (req: Request, res: Response) => {
    try {
      const { location, userId, password } =
        req.body as SaveInventoryLocationRequest;
      if (!location) {
        throw new Error('No location given.');
      } else if (!location.name) {
        throw new Error('No location name given.');
      } else if (!location._id) {
        throw new Error('No location id given.');
      }

      console.log({ location, userId, password });
      const user = await getAndThenCacheUser(userId);
      await checkIsAuthorized(password, user?.password);

      const updatedLocation = await InventorySchema.findOneAndUpdate(
        { userId }, // Query to match existing document
        { $addToSet: { locations: location } }, // Adds location only if it doesn't exist
        { new: true, upsert: true } // Return the new doc and upsert if not found
      );

      return res.send(updatedLocation);
    } catch (error) {
      handleError(res, error, 500);
    }
  }
);

/**
 * For the case when we need to update an existing inventory location in the db.
 **/
router.put(
  `${INVENTORY_PATH}/location`,
  async (req: Request, res: Response) => {
    try {
      const { location, userId, password } =
        req.body as UpdateInventoryLocationRequest;
      if (!location) {
        throw new Error('No location given.');
      } else if (!location.name) {
        throw new Error('No location name given.');
      } else if (!location._id) {
        throw new Error('No location id given.');
      }

      console.log({ location, userId, password });
      const user = await getAndThenCacheUser(userId);
      await checkIsAuthorized(password, user?.password);

      // Build dynamic update object skipping _id
      const updateFields: any = {};
      Object.keys(location).forEach((key) => {
        if (key !== '_id') {
          updateFields[`${inventoryLocationsFieldName}.$.${key}`] = (
            location as any
          )[key];
        }
      });

      const updatedInventory = await InventorySchema.findOneAndUpdate(
        { userId, [`${inventoryLocationsFieldName}._id`]: location._id },
        { $set: updateFields },
        { new: true, upsert: true }
      );

      return res.send(updatedInventory);
    } catch (error) {
      handleError(res, error, 500);
    }
  }
);

export default router;
