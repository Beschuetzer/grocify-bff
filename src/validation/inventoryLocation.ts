import { InventoryLocation } from '../types';

export const DEFAULT_LOCATION_VALIDATORS: {
  errorMessage: string;
  key: string;
  validator: (value: any) => boolean;
}[] = [
  {
    validator: (value) => value != null,
    key: '_id',
    errorMessage: 'All locations must have an id.',
  },
  {
    validator: (value) => value != null,
    key: 'name',
    errorMessage: 'All locations must have a name.',
  },
];
