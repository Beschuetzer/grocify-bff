import { string } from 'zod';
import { StoreSpecificValuesMap } from '../types';

type ReplaceKeysInStoreSpecificValuesMapMapping = { [key: string]: string };

/**
 *Replaces keys in the `storeSpecificValuesMap` with the value in `keyMapping`.
 *Use when saving and when restoring storeSpecificValues
 **/
export function getReplacedValuesMap(
  keyMapping: ReplaceKeysInStoreSpecificValuesMapMapping,
  storeSpecificValuesMap?: StoreSpecificValuesMap
) {
  const toReturn = {};
  for (const key of Object.keys(storeSpecificValuesMap || {})) {
    const values = (storeSpecificValuesMap as StoreSpecificValuesMap)[key];
    (toReturn as any)[keyMapping[key]] = values;
  }
  return toReturn;
}
