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

type ExtractInnerType<T> = T extends StoreSpecificValue<infer U> ? U : never;

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
export enum StoreSpecificValueKey {
  AisleNumber = 'aisleNumber',
  IsInCart = 'isInCart',
  ItemId = 'itemId',
  Note = 'note',
  Price = 'price',
  Quantity = 'quantity',
}

export type StoreSpecificValues = {
  [StoreSpecificValueKey.AisleNumber]?: StoreSpecificValue<number>;
  [StoreSpecificValueKey.IsInCart]?: StoreSpecificValue<boolean>;
  [StoreSpecificValueKey.ItemId]?: StoreSpecificValue<string>;
  [StoreSpecificValueKey.Note]?: StoreSpecificValue<string>;
  [StoreSpecificValueKey.Price]?: StoreSpecificValue<number>;
  [StoreSpecificValueKey.Quantity]?: StoreSpecificValue<number>;
}
export type StoreSpecificValue<T> ={ [storeKey: string]: T }
export type StoreSpecificValueTypes = ExtractInnerType<ExtractInnerType<StoreSpecificValues>>
export type StoreSpecificValuesMap = { [key: string]: StoreSpecificValues };
export type StoreSpecificValuesSchema = {
  userId: string;
  values: StoreSpecificValuesMap;
}
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

//#region Documents
export type UserDocument = mongoose.Document & UserAccount;
export type ItemDocument = mongoose.Document & SaveItemRequest;
export type StoreSpecificValuesDocument = mongoose.Document & StoreSpecificValuesSchema;
//#endregion

//#region Requests and Related
export type AccountCredentials = {
  password?: string;
  userId?: string;
}

export type DeleteManyRequest = { 
  ids: string[];
} & AccountCredentials;
export type SaveItemRequest = {
  item: Item;
  storeSpecificValuesMap: StoreSpecificValuesMap;
} & AccountCredentials;
export type SaveManyItemsRequest = {
  items: Item[];
  storeSpecificValuesMap: StoreSpecificValuesMap;
} & AccountCredentials;
//#endregion


//#region Store
export type Address = AddressGeneric<string>;
export type AddressGeneric<T> = {
  addressLineOne: T;
  addressLineTwo?: T;
  city: T;
  country: T;
  state: T;
  zipCode: T;
};
export type Store = {
  gpsCoordinates?: GpsCoordinate;
  name: string;
  calculatedDistance?: number;
} & Partial<Address>;
export type GpsCoordinate = {
  lat: string;
  lon: string;
};
//#endregion