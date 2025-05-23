import mongoose from 'mongoose';
import { XOR } from 'ts-xor';

export type AddedDate = {
  addedDate: number;
};

export type CurrentPassword = {
  currentPassword: string;
};

export type NewPassword = {
  newPassword: string;
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
  /**
   *This is in milliseconds
   **/
  frequency?: number;
  fullscreenImage?: string;
  images: string[];
  imageToUseIndex: number;
  lastUpdatedDate: number;
  unit: string;
} & Id &
  AddedDate;

export type List<T> = {
  data: T[];
  sortOrderValue: SortOrderValue;
  filters: ListFilterFilters<T>;
};
export type ListFilterFilters<T> = Partial<Record<keyof T, string>>;

export type OriginalKeyProp = {
  originalKey: Key;
};

export type SortOrders = {
  [key: string]: SortOrderValue;
};
export type SortOrderValue = { sortBy: string; sortOrder: string };

/**
 *This represents something that can be added to any store
 **/
export type Item = Key & ItemBase;
export type ItemWithStoreSpecificValues = Item & StoreSpecificValues;
export type LastPurchasedMap = { [key: string]: StoreSpecificValue<number> };
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
};
export type StoreSpecificValue<T> = { [storeKey: string]: T };
export type StoreSpecificValueTypes = ExtractInnerType<
  ExtractInnerType<StoreSpecificValues>
>;
export type StoreSpecificValuesMap = { [key: string]: StoreSpecificValues };
export type StoreSpecificValuesSchema = {
  userId: string;
  values: StoreSpecificValuesMap;
};
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
export type StoreSpecificValuesDocument = mongoose.Document &
  StoreSpecificValuesSchema;
//#endregion

//#region Requests and Related
export type AccountCredentials = {
  password?: string;
  userId?: string;
};

export type DeleteInventoryItemsRequest = {
  inventoryItems: (Required<
    Pick<InventoryItemsInput, 'locationId' | 'itemId'>
  > & {
    expirationDates: number[];
  })[];
} & AccountCredentials;
export type DeleteInventoryLocationRequest = SaveInventoryLocationRequest;

/**
 *The index for a given key should be the same index for that given id
 **/
export type DeleteManyRequest = {
  ids: string[];
  /**
   *This will be the key used in {@link StoreSpecificValuesMap} and {@link LastPurchasedMap}
   **/
  keys?: string[];
  /**
   *This is the url to the image in the cloud
   **/
  imagePaths?: string[];
} & AccountCredentials;
export type DeleteValuesDocumentRequest = AccountCredentials;
export type MoveInventoryItemsRequest = {
  itemsToMove: MoveInventoryItemRequest[];
} & AccountCredentials;
export type MoveInventoryItemExpirationDatesRequest = {
  itemsToMove: (MoveInventoryItemRequest & {
    expirationDates: InventoryItemExpirationDates;
  })[];
} & AccountCredentials;
export type SaveAllRequest = AccountCredentials & {
  inventory: Inventory;
  items: List<Item>;
  keysToDeleteFromStoreSpecificValuesMap: string[];
  lastPurchasedMap: LastPurchasedMap;
  stores: List<Store> & { currentStoreId: string };
  storeSpecificValues: StoreSpecificValuesMap;
};
export type SaveInventoryItemsRequest = {
  inventoryItems: InventoryItemsInput[];
} & AccountCredentials;
export type SaveInventoryLocationRequest = {
  locations: InventoryLocation[];
} & AccountCredentials;
export type SaveItemRequest = {
  item: Item;
  storeSpecificValuesMap: StoreSpecificValuesMap;
} & AccountCredentials &
  OriginalKeyProp;
export type SaveManyItemsRequest = {
  items: Item[];
  storeSpecificValuesMap: StoreSpecificValuesMap;
} & AccountCredentials;
export type SaveStoreRequest = {
  store: Store;
} & AccountCredentials;
export type SaveLastPurchasedMapRequest = {
  lastPurchasedMap: LastPurchasedMap;
} & AccountCredentials;
export type UpdateInventoryLocationRequest = SaveInventoryLocationRequest;
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
  calculatedDistance?: number;
} & AddedDate &
  Partial<Address> &
  Omit<Required<Key>, 'upc'>;
export type GpsCoordinate = {
  lat: string;
  lon: string;
};
//#endregion

//#region Inventory
export type Inventory = {
  items: InventoryItems<InventoryItem>;
  locations: InventoryLocation[];
  currentLocationId: Id['_id'] | undefined | null;
};

export type InventoryItems<T> = {
  [locationId: string]: InventoryLocationItem<T>;
};

export type InventoryItemsInput = {
  /**
   * * The ID of the location where the item is being inserted.
   * If not provided, the item will be inserted into the current location.
   **/
  locationId?: string;
  item: InventoryItem;
  itemId: string;
};

export type InventoryLocationItem<T> = {
  [itemId: string]: T;
};

export type InventoryItem = {
  expirationDates: InventoryItemExpirationDates;
};

export type InventoryItemExpirationDates = { [key: string]: number };

export type InventoryLocation = {
  description?: string;
  gpsCoordinates?: GpsCoordinate;
  name: string;
} & Id;

export type MoveInventoryItemRequest = {
  itemId: string;
  originLocationId: string;
  targetLocationId: string;
};

//#endregion
