import { storeSpecificValuesSchemaValueFieldName } from '../schema/storeSpecificValues';
import { getUnsetObj } from './getUnsetObj';

const keys = [
  '0000000000001',
  '0000000000002',
  '0000000000003',
  '0000000000004',
];
describe('getUnsetObj', () => {
  test('can handle falsy', () => {
    const actual = getUnsetObj([]);
    expect(actual).toStrictEqual({});
  });
  test('works as expected', () => {
    const actual = getUnsetObj(keys);
    expect(Object.keys(actual).length).toStrictEqual(keys.length);
    for (const key of keys) {
      expect(
        actual[`${storeSpecificValuesSchemaValueFieldName}.${key}`]
      ).toStrictEqual(1);
    }
  });
});
