import { storeSpecificValuesSchemaValueFieldName } from "../schema/storeSpecificValues";
import { StoreSpecificValueTypes, StoreSpecificValuesMap } from "../types";

export type GetUpdateObjectForStoreSpecificValuesResponse = {
  [key: string]: number | string | boolean;
};
/**
 *This returns an object that can be used to update a StoreSpecificSchema document's `values` object
 **/
export function getUpdateObjectForStoreSpecificValues(
  storeSpecificValuesMap?: StoreSpecificValuesMap
) {
  if (
    !storeSpecificValuesMap ||
    Object.keys(storeSpecificValuesMap || {}).length <= 0
  )
    return [];
  const toReturn = {} as { [key: string]: StoreSpecificValueTypes };
  
  function iterate(current: { [key: string]: any }, path: string) {
    if (typeof current === "object" && current !== null) {
      for (let key in current) {
        if (current.hasOwnProperty(key)) {
          iterate(current[key], path ? `${path}.${key}` : key);
        }
      }
    } else {
      toReturn[`${storeSpecificValuesSchemaValueFieldName}.${path}`] = current;
    }
  }

  iterate(storeSpecificValuesMap, "");
  return toReturn;
}
