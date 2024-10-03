import { storeSpecificValuesSchemaValueFieldName } from "../schema/storeSpecificValues";

/**
 *Takes a list of ids and returns an object used to remove the fields for those ids in the StoreSpecificValuesSchema
 **/
export function getUnsetObj(keys: string[]) {
  if (!keys || keys.length <= 0) return {};
  const toReturn = {} as any;
  for (const key of keys) {
    if (!key) continue;
    toReturn[`${storeSpecificValuesSchemaValueFieldName}.${key}`] = 1;
  }
  return toReturn;
}
