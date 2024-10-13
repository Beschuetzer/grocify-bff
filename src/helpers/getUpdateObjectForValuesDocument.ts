import { sanitize } from '.';
import { storeSpecificValuesSchemaValueFieldName } from '../schema/storeSpecificValues';

/**
 *This returns an object that can be used to update a LastPurchasedMapSchema document's `values` object
 * `.` is replace with empty space.
 **/
export function getUpdateObjectForValuesDocument<T, K>(obj?: T) {
  if (!obj || Object.keys(obj || {}).length <= 0) {
    return [];
  }
  const toReturn = {} as { [key: string]: K };

  function iterate(current: { [key: string]: any }, path: string) {
    if (typeof current === 'object' && current !== null) {
      for (let key in current) {
        if (key && current.hasOwnProperty(key)) {
          const replacedKey = sanitize(key);
          iterate(current[key], path ? `${path}.${replacedKey}` : replacedKey);
        }
      }
    } else {
      toReturn[`${storeSpecificValuesSchemaValueFieldName}.${path}`] = current;
    }
  }

  iterate(obj, '');

  return toReturn;
}
