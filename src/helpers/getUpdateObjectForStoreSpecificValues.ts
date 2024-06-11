import { StoreSpecificValues, StoreSpecificValuesMap } from "../types";

/**
*This returns an object that can be used to update a StoreSpecificSchema document's `values` object
**/
export function getUpdateObjectForStoreSpecificValues(storeSpecificValuesMap?: StoreSpecificValuesMap) {
  if (!storeSpecificValuesMap || Object.keys(storeSpecificValuesMap || {}).length <= 0) return [];
  //todo map the storeSpecificValues to an object like:
  // {
  //   "values.keyToUse.storeSpecificValueKey.storeName": value
  //   "values.400601364519.aisleNumber.target": 987
  //   "values.400601364519.quantity.target": 2
  //   ...
  // }
    const toReturn = [] as [string, unknown][];

    function iterate(current: {[key: string]: any}, path: string) {
        if (typeof current === 'object' && current !== null) {
            for (let key in current) {
                if (current.hasOwnProperty(key)) {
                    iterate(current[key], path ? `${path}.${key}` : key);
                }
            }
        } else {
            toReturn.push([path, current]);
        }
    }

    iterate(storeSpecificValuesMap, "");
    return toReturn;
}