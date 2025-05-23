import express, { Request, Response } from 'express';
import {
  hashPassword,
  handleError,
  getAndThenCacheUser,
  getErrorMessage,
  validateMatchesSchema,
} from '../helpers';
import { UserSchema } from '../schema/user';
import { REGISTERED_USERS_CACHE as USERS_CACHE } from '../cache';
import { checkIsAuthorized } from '../middlware/isAuthenticated';
import {
  AccountCredentials,
  CurrentPassword,
  Item,
  LastPurchasedMap,
  NewPassword,
  SaveAllRequest,
  Store,
  StoreSpecificValuesMap,
  UserAccount,
  UserDocument,
} from '../types';
import { ITEM_PATH, PASSWORD_SCHEMA, USER_PATH } from './constants';
import {
  StoreSpecificValuesSchema,
  StoreSchema,
  ItemSchema,
  LastPurchasedMapSchema,
  SettingsSchema,
} from '../schema/';
import { Document } from 'mongoose';
import { getUpdateObjectForValuesDocument } from '../helpers/getUpdateObjectForValuesDocument';
import { BULK_WRITE_RESULT_DEFAULT, EMPTY_STRING } from '../constants';
import { getUnsetObj } from '../helpers/getUnsetObj';
import { S3_CLIENT_WRAPPER } from '../services/S3ClientWrapper';
import { InventorySchema } from '../schema/inventory';

const router = express.Router({
  mergeParams: true,
});

router.post(`${USER_PATH}`, async (req: Request, res: Response) => {
  const { email, password } = req.body as Pick<
    UserAccount,
    'email' | 'password'
  >;

  try {
    const sanitizedEmail = email.trim().toLowerCase();
    const sanitizedPassword = password.trim();
    validateMatchesSchema(PASSWORD_SCHEMA, sanitizedPassword);
    hashPassword(sanitizedPassword, async function (err, hash) {
      try {
        const createdUser = new UserSchema({
          email: sanitizedEmail,
          password: hash,
        });
        const savedUser = (await createdUser.save()) as UserDocument;
        USERS_CACHE.set(savedUser._id.toString(), savedUser);
        res.send(savedUser);
      } catch (error) {
        handleError(res, error);
      }
    });
  } catch (error) {
    handleError(res, error);
  }
});

router.get(`${USER_PATH}/:id`, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await getAndThenCacheUser(id);
    res.send({
      ...user,
      password: EMPTY_STRING,
    });
  } catch (error) {
    handleError(res, error);
  }
});

router.delete(`${USER_PATH}`, async (req: Request, res: Response) => {
  try {
    const { password, userId } = req.body as Required<AccountCredentials>;
    const user = await getAndThenCacheUser(userId);
    await checkIsAuthorized(password, user?.password);

    const deletedInventoryPromise = InventorySchema.deleteOne({ userId });
    const deletedItemsPromise = ItemSchema.deleteMany({ userId });
    const deletedLastPurchasedMapPromise = LastPurchasedMapSchema.deleteMany({
      userId,
    });
    const deletedStoresPromise = StoreSchema.deleteMany({ userId });
    const deletedSettingsPromise = SettingsSchema.deleteOne({ userId });
    const deletedStoreSpecificItemsPromise =
      StoreSpecificValuesSchema.deleteOne({ userId });
    const deleteS3ObjectsPromise = S3_CLIENT_WRAPPER.deleteUserObjs(userId);

    const [
      deletedInventory,
      deletedItems,
      deletedLastPurchasedMap,
      deletedSettings,
      deletedStores,
      deletedStoreSpecificItems,
      deletedS3Objects,
    ] = await Promise.all([
      deletedInventoryPromise,
      deletedItemsPromise,
      deletedLastPurchasedMapPromise,
      deletedSettingsPromise,
      deletedStoresPromise,
      deletedStoreSpecificItemsPromise,
      deleteS3ObjectsPromise,
    ]);

    const deletedUser = await UserSchema.findByIdAndDelete(userId);
    if (!deletedUser) {
      throw new Error(`Unable to delete the user with the id of ${userId}.`);
    }

    USERS_CACHE.delete(userId);
    res.send({
      deletedInventory,
      deletedItems,
      deletedLastPurchasedMap,
      deletedS3Objects,
      deletedSettings,
      deletedStores,
      deletedStoreSpecificItems,
      deletedUser,
    });
  } catch (error) {
    handleError(res, error);
  }
});

router.delete(
  `${USER_PATH}${ITEM_PATH}/all`,
  async (req: Request, res: Response) => {
    try {
      const { password, userId } = req.body as Required<AccountCredentials>;
      const user = await getAndThenCacheUser(userId);
      await checkIsAuthorized(password, user?.password);
      const deletedItems = await ItemSchema.deleteMany({ userId });
      console.log({ deletedItems });
      res.send(deletedItems);
    } catch (error) {
      handleError(res, error);
    }
  }
);

router.put(`${USER_PATH}`, async (req: Request, res: Response) => {
  const userToUpdate = req.body as UserDocument;
  const { _id, password, currentPassword } = req.body as UserAccount &
    CurrentPassword;

  try {
    const user = await getAndThenCacheUser(_id);
    await checkIsAuthorized(currentPassword, user?.password);
    hashPassword(password || currentPassword, async (err, hash) => {
      try {
        if (err || !hash) {
          res
            .status(500)
            .send(
              getErrorMessage(`Unable to update user with id of '${_id}'.`)
            );
        }

        const updatedUser = await UserSchema.updateOne(
          { _id },
          {
            ...userToUpdate,
            password: hash,
          }
        );
        if (updatedUser.modifiedCount > 0) {
          USERS_CACHE.delete(_id);
        }
        res.send(updatedUser);
      } catch (error) {
        handleError(res, error);
      }
    });
  } catch (error) {
    handleError(res, error);
  }
});

router.get(
  `${USER_PATH}/isEmailAvailable/:email`,
  async (req: Request, res: Response) => {
    const { email } = req.params as Pick<UserAccount, 'email'>;
    const trimmedEmail = email.trim();
    try {
      const user = await UserSchema.findOne({
        email: { $regex: new RegExp(trimmedEmail, 'i') },
      });
      res.send(!user);
    } catch (error) {
      handleError(res, error);
    }
  }
);

router.post(
  `${USER_PATH}/changePassword`,
  async (req: Request, res: Response) => {
    const { _id, password, newPassword } = req.body as UserAccount &
      NewPassword;
    console.log({ _id, password, newPassword });

    try {
      const user = await getAndThenCacheUser(_id);
      await checkIsAuthorized(password, user?.password);

      if (!newPassword) {
        throw new Error('No new password given');
      }
      hashPassword(newPassword, async (err, hash) => {
        try {
          if (err || !hash) {
            throw new Error(
              `Unable to hash the new password for user with id of '${_id}'.`
            );
          }

          const newUser = {
            _id,
            email: user.email,
            password: hash,
          } as UserDocument;
          const updatedUser = await UserSchema.updateOne({ _id }, newUser);
          USERS_CACHE.set(_id, newUser);
          res.send({
            success:
              !!updatedUser.acknowledged && updatedUser.modifiedCount > 0,
          });
        } catch (error) {
          handleError(res, error);
        }
      });
    } catch (error) {
      handleError(res, error);
    }
  }
);

router.post(`${USER_PATH}/login`, async (req: Request, res: Response) => {
  const { email, password } = req.body as Omit<UserAccount, '_id'>;
  console.log({ email, password, body: req.body });
  try {
    if (!email) throw new Error('No email given');
    if (!password) throw new Error('No password given');
    const trimmedEmail = email.trim();
    const user = await UserSchema.findOne({
      email: { $regex: new RegExp(trimmedEmail, 'i') },
    });
    console.log({ user });

    await checkIsAuthorized(password, user?.password);
    res.send(user);
  } catch (error) {
    handleError(res, error);
  }
});

router.post(`${USER_PATH}/loadAll`, async (req: Request, res: Response) => {
  try {
    const { password, userId } = req.body;
    if (!userId) throw new Error('No userId given');
    if (!password) throw new Error('No password given');
    const user = await UserSchema.findById(userId);
    await checkIsAuthorized(password, user?.password);

    const itemsPromise = ItemSchema.find({ userId });
    const settingsPromise = SettingsSchema.findOne({ userId });
    const inventoryPromise = InventorySchema.findOne({ userId });
    const storesPromise = StoreSchema.find({ userId });
    const storeSpecificValuesPromise = StoreSpecificValuesSchema.findOne({
      userId,
    });
    const lastPurchasedMapPromise = LastPurchasedMapSchema.findOne({ userId });
    const [
      inventory,
      items,
      stores,
      storeSpecificValues,
      lastPurchasedMap,
      settings,
    ] = await Promise.all([
      inventoryPromise,
      itemsPromise,
      storesPromise,
      storeSpecificValuesPromise,
      lastPurchasedMapPromise,
      settingsPromise,
    ]);

    if (!storeSpecificValues?.values) {
      throw new Error('Unable to load storeSpecificValues properly');
    }
    res.send({
      inventory,
      items,
      stores,
      storeSpecificValues: storeSpecificValues.values,
      lastPurchasedMap: lastPurchasedMap?.values,
      settings,
    });
  } catch (error) {
    handleError(res, error);
  }
});

router.post(`${USER_PATH}/saveAll`, async (req: Request, res: Response) => {
  try {
    const {
      items: itemsList,
      inventory,
      keysToDeleteFromStoreSpecificValuesMap,
      lastPurchasedMap,
      password,
      stores: storesList,
      storeSpecificValues,
      userId,
    } = req.body as SaveAllRequest;
    console.log({
      inventory,
    });
    if (!userId) throw new Error('No userId given');
    if (!password) throw new Error('No password given');
    const user = await UserSchema.findById(userId);
    await checkIsAuthorized(password, user?.password);

    //creates documents for saving
    let items = [] as any[];
    let stores = [] as any[];

    if (itemsList?.data?.length > 0) {
      items = await Promise.all(
        itemsList.data.map(async function (item: Item) {
          let existingDocument = await ItemSchema.findById(item._id);
          if (!existingDocument) {
            return new ItemSchema({
              ...item,
              userId: user?._id,
            });
          }
          updateDocument<Item>(existingDocument, item);
          return existingDocument;
        })
      );
    }

    if (storesList?.data?.length > 0) {
      stores = await Promise.all(
        storesList.data.map(async function (store: Store) {
          let existingDocument = await StoreSchema.findById(store._id);
          if (!existingDocument) {
            return new StoreSchema({
              ...store,
              userId: user?._id,
            });
          }
          updateDocument<Store>(existingDocument, store);
          return existingDocument;
        })
      );
    }

    const settingsPromise = SettingsSchema.findOneAndUpdate(
      { userId: userId.toString() },
      {
        userId,
        currentStoreId: storesList.currentStoreId,
        sortOrderValues: {
          items: itemsList.sortOrderValue,
          stores: storesList.sortOrderValue,
        },
      },
      { upsert: true, new: true }
    );

    const inventoryPromise = await InventorySchema.findOneAndUpdate(
      { userId: userId.toString() },
      {
        ...inventory,
        userId,
      },
      { upsert: true, new: true }
    );

    const storeSpecificValuesPromise =
      Object.keys(storeSpecificValues || {}).length > 0
        ? StoreSpecificValuesSchema.findOneAndUpdate(
            { userId: userId.toString() },
            {
              ...getUpdateObjectForValuesDocument<
                StoreSpecificValuesMap,
                StoreSpecificValuesMap[string]
              >(storeSpecificValues),
              $unset: getUnsetObj(keysToDeleteFromStoreSpecificValuesMap),
            },
            { upsert: true, new: true }
          )
        : Promise.resolve({});

    const lastPurchasedMapPromise =
      Object.keys(lastPurchasedMap || {}).length > 0
        ? LastPurchasedMapSchema.findOneAndUpdate(
            { userId: userId.toString() },
            getUpdateObjectForValuesDocument<
              LastPurchasedMap,
              LastPurchasedMap[string]
            >(lastPurchasedMap),
            { upsert: true, new: true }
          )
        : Promise.resolve({});

    const startBulkSave = performance.now();
    const itemsBulkSavePromise =
      items.length > 0
        ? ItemSchema.bulkSave(items)
        : Promise.resolve(BULK_WRITE_RESULT_DEFAULT);
    const storesBulkSavePromise =
      stores.length > 0
        ? StoreSchema.bulkSave(stores)
        : Promise.resolve(BULK_WRITE_RESULT_DEFAULT);
    const [
      inventoryResult,
      itemsResult,
      lastPurchasedMapResult,
      storesResult,
      storeSpecificValuesResult,
      settingsResult,
    ] = await Promise.all([
      inventoryPromise,
      itemsBulkSavePromise,
      lastPurchasedMapPromise,
      storesBulkSavePromise,
      storeSpecificValuesPromise,
      settingsPromise,
    ]);
    const endBulkSave = performance.now();
    // console.log({
    //   timeToSave: endBulkSave - startBulkSave,
    //   itemsResult,
    //   lastPurchasedMapResult,
    //   storesResult,
    //   storeSpecificValuesResult,
    //   settingsResult,
    // });
    res.send({
      inventoryResult,
      itemsResult,
      lastPurchasedMapResult,
      storesResult,
      storeSpecificValuesResult,
      settingsResult,
    });
  } catch (error) {
    handleError(res, error);
  }
});

export default router;

function updateDocument<T>(existingItem: Document<unknown, {}, T>, newItem: T) {
  if (!existingItem || !newItem) return null;
  for (const key of Object.keys(newItem)) {
    const typedKey = key as keyof Document<unknown, {}, T>;
    existingItem[typedKey] = newItem[typedKey as keyof T];
  }
}
