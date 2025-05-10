import express, { Request, Response } from 'express';
import {
  getAndThenCacheUser,
  getInventoryOrThrow,
  handleError,
} from '../helpers';
import { INVENTORY_PATH } from './constants';
import { checkIsAuthorized } from '../middlware/isAuthenticated';
import { SaveInventoryLocationRequest } from '../types';
import { InventorySchema } from '../schema/inventory';

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
 * For the case when the inventory location is already in the db and we want to add a new item to it.
 **/
router.post(
  `${INVENTORY_PATH}/location/:id`,
  async (req: Request, res: Response) => {
    try {
      const { location, userId, password } =
        req.body as SaveInventoryLocationRequest;
      console.log({
        location,
      });
      const user = await getAndThenCacheUser(userId);
      await checkIsAuthorized(password, user?.password);
      //need to update the inventory location in the db

      return res.send();
    } catch (error) {
      handleError(res, error, 500);
    }
  }
);

export default router;
