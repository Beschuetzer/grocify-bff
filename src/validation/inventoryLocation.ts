import { InventoryLocation } from '../types';

export const DEFAULT_LOCATION_VALIDATORS: {
  errorMessage: string;
  name: keyof InventoryLocation;
  validator: (value: any) => boolean;
}[] = [
  {
    validator: (value) => value != null,
    name: '_id',
    errorMessage: 'All locations must have an id.',
  },
  {
    validator: (value) => value != null,
    name: 'name',
    errorMessage: 'All locations must have a name.',
  },
];
