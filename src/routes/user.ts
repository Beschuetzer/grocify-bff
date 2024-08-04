import express, { Request, Response } from "express";
import {
  hashPassword,
  handleError,
  getAndThenCacheUser,
  getErrorMessage,
  validateMatchesSchema,
} from "../helpers";
import { UserSchema } from "../schema/user";
import { REGISTERED_USERS_CACHE as USERS_CACHE } from "../cache";
import { checkIsAuthorized } from "../middlware/isAuthenticated";
import { AccountCredentials, CurrentPassword, UserAccount, UserDocument } from "../types";
import { ITEM_PATH, PASSWORD_SCHEMA, USER_PATH } from "./constants";
import { ItemSchema } from "../schema";
import { StoreSpecificValuesSchema } from "../schema/storeSpecificValues";
import { Document } from "mongoose";

const router = express.Router({
  mergeParams: true,
});

router.post(`${USER_PATH}`, async (req: Request, res: Response) => {
  const { email, password } = req.body as Pick<
    UserAccount,
    "email" | "password"
  >;

  try {
    const sanitizedEmail = email.trim().toLowerCase();
    const sanitizedPassword = password.trim();
    validateMatchesSchema(PASSWORD_SCHEMA, sanitizedPassword)
    hashPassword(sanitizedPassword, async function (err, hash) {
      try {
        const createdUser = new UserSchema({ email: sanitizedEmail, password: hash });
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
    res.send(user);
  } catch (error) {
    handleError(res, error);
  }
});

router.delete(`${USER_PATH}`, async (req: Request, res: Response) => {
  try {
    const { password, userId } = req.body as Required<AccountCredentials>;
    const user = await getAndThenCacheUser(userId);
    await checkIsAuthorized(password, user?.password);
    const deletedUser = await UserSchema.findByIdAndDelete(userId);
    const deletedItems = await ItemSchema.deleteMany({ userId })
    const deletedStoreSpecificItems = await StoreSpecificValuesSchema.deleteOne({ userId })
    if (!!deletedUser) {
      USERS_CACHE.delete(userId);
    }
    res.send(deletedUser);
  } catch (error) {
    handleError(res, error);
  }
});

router.delete(`${USER_PATH}${ITEM_PATH}/all`, async (req: Request, res: Response) => {
  try {
    const { password, userId } = req.body as Required<AccountCredentials>;
    const user = await getAndThenCacheUser(userId);
    await checkIsAuthorized(password, user?.password);
    const deletedItems = await ItemSchema.deleteMany({ userId })
    console.log({deletedItems});
    res.send(deletedItems);
  } catch (error) {
    handleError(res, error);
  }
});

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
    const { email } = req.params as Pick<UserAccount, "email">;
    const trimmedEmail = email.trim();
    try {
      const user = await UserSchema.findOne({
        email: { $regex: new RegExp(trimmedEmail, "i") },
      });
      res.send(!user);
    } catch (error) {
      handleError(res, error);
    }
  }
);

router.post(
  `${USER_PATH}/login`,
  async (req: Request, res: Response) => {
    const { email, password } = req.body as Omit<UserAccount, '_id'>
    console.log({email, password, body: req.body});
    try {
      if (!email) throw new Error('No email given');
      if (!password) throw new Error('No password given');
      const trimmedEmail = email.trim();
      const user = await UserSchema.findOne({
        email: { $regex: new RegExp(trimmedEmail, "i") },
      });
      console.log({user});
      
      await checkIsAuthorized(password, user?.password);
      res.send(user);
    } catch (error) {
      handleError(res, error);
    }
  }
);

router.post(
  `${USER_PATH}/saveAll`,
  async (req: Request, res: Response) => {
    const { 
      items: itemsList,
      lastPurchasedMap,
      password,
      stores: storesList,
      storeSpecificValues,
      userId, 
    } = req.body
    console.log( { 
      itemsList,
      storesList,
      storeSpecificValues,
      lastPurchasedMap,
      userId,
      password,
      data: itemsList.data
    });
    try {
      if (!userId) throw new Error('No userId given');
      if (!password) throw new Error('No password given');
      const user = await UserSchema.findById(userId);
      await checkIsAuthorized(password, user?.password);

      //save items in bulk (doesn't return the ids though)
      const items = await Promise.all(itemsList.data.map(async function (item: Document){
        let itemToReturn = await ItemSchema.findById(item._id);
        if (!itemToReturn) {
          itemToReturn = new ItemSchema({
             ...item,
             userId: user?._id
          });
        }
        return itemToReturn;
      }));

      //todo: save all the data here (make sure that existing data isn't overridden?)
      //todo: need to return all the saved values to the frontend so it can populate the redux with the new ids created for each type (item, store, etc)
      //  --may be able just return the values for the writeResult.upsertedIds and writeResult.insertedIds but need to look up the method for that
      //todo: use await Promise.all for each 

      const startBulkSave = performance.now();
      const itemsResult = await ItemSchema.bulkSave(items);
      const endBulkSave = performance.now();
      console.log({timeToSave: endBulkSave - startBulkSave});

      let itemRetrievalPromise = new Promise(resolve => resolve([]));
      if (itemsResult.insertedCount > 0) {
        console.log({insertCount: itemsResult.insertedCount});
        console.log({writeResult: itemsResult});
        
        const startItemRetrieval = performance.now();
        itemRetrievalPromise = ItemSchema.find({userId: user?._id})
        const endItemRetrieval = performance.now();
        console.log({timeToRetrieveItems: endItemRetrieval - startItemRetrieval});
      }

      const resolvedPromises = await Promise.all([
        itemRetrievalPromise,
        new Promise(resolve => resolve([]))
      ])

      console.log({resolvedItems: resolvedPromises[0], test: resolvedPromises[1]});
      res.send({
        itemsResult
      });
    } catch (error) {
      handleError(res, error);
    }
  }
);

export default router;
