import { storeSpecificValuesSchemaValueFieldName } from "../schema/storeSpecificValues";

/**
 *Takes a list of ids and returns an object used to remove the fields for those ids in the StoreSpecificValuesSchema
 **/
export function getUnsetObj(ids: string[]) {
  if (!ids || ids.length <= 0) return {};
  const toReturn = {} as any;
  for (const id of ids) {
    toReturn[`${storeSpecificValuesSchemaValueFieldName}.${id}`] = 1;
  }
  return toReturn;
}
