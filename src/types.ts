import mongoose from "mongoose";
import { XOR } from "ts-xor";

export type CurrentPassword = {
  currentPassword: string;
};

export type ErrorMessage = {
  errorResponse: {
    message: string;
  };
};

/**
 *This is the id used to save the item in db
 **/
export type Id = {
  _id?: string;
};

export type Key = XOR<
  {
    _id: string;
    name: string;
    upc?: string;
  },
  {
    _id: string;
    name?: string;
    upc: string;
  }
>;

export type ItemBase = {
  addedDate: number;
  /**
   *This is in milliseconds
   **/
  frequency?: number;
  fullscreenImage?: string;
  images: string[];
  imageToUseIndex: number;
  lastUpdatedDate: number;
  unit: string;
} & Id;

/**
 *This represents something that can be added to any store
 **/
export type Item = Key & ItemBase;
export type ItemWithStoreSpecificValues = Item & StoreSpecificValues;
export type ItemSaved = {
  item: ItemWithStoreSpecificValues;
  password?: string;
  userId?: string;
};

export enum StoreSpecificValueKey {
  AisleNumber = "aisleNumber",
  ItemId = "itemId",
  Price = "price",
  Quantity = "quantity",
  IsInCart = "isInCart",
}

export type StoreSpecificValues = {
  [StoreSpecificValueKey.AisleNumber]: StoreSpecificValue<number>;
  [StoreSpecificValueKey.IsInCart]: StoreSpecificValue<boolean>;
  [StoreSpecificValueKey.ItemId]: StoreSpecificValue<string>;
  [StoreSpecificValueKey.Price]: StoreSpecificValue<number>;
  [StoreSpecificValueKey.Quantity]: StoreSpecificValue<number>;
} | null;

export type StoreSpecificValue<T> =
  | { [storeKey: string]: T }
  | null
  | undefined;
export type StoreSpecificValueUpdater = Partial<{
  [key in StoreSpecificValueKey]: (currentValue: any) => any;
}>;

/**
 *Need to update User schema if changes made here
 **/
export type UserAccount = {
  _id: string;
  email: string;
  password: string;
};
export type UserDocument = mongoose.Document & UserAccount;
export type ItemDocument = mongoose.Document & ItemSaved;
