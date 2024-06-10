import { StoreSpecificValues } from "../types";

/**
*This returns an object that can be used to update a StoreSpecificSchema document's `values` object
**/
export function getUpdateObjectForStoreSpecificValues(storeSpecificValues?: StoreSpecificValues) {
  if (!storeSpecificValues || Object.keys(storeSpecificValues || {}).length <= 0) return {};
  //todo map the storeSpecificValues to an object like:
  // {
  //   "values.keyToUse.storeSpecificValueKey.storeName": value
  //   "values.400601364519.aisleNumber.target": 987
  //   "values.400601364519.quantity.target": 2
  //   ...
  // }
  return {

    }
}