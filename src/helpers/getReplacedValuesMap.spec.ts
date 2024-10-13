import { getReplacedValuesMap } from './getReplacedValuesMap';
import { StoreSpecificValuesMap } from '../types';

const MOCK_UPCS = ['000000000001', '000000000002', '000000000003'];
const MOCK_VALUE = {
  aisleNumber: {
    target: 12,
  },
};
function getMockMap() {
  return {
    [MOCK_UPCS[0]]: MOCK_VALUE,
    [MOCK_UPCS[1]]: MOCK_VALUE,
    [MOCK_UPCS[2]]: MOCK_VALUE,
  } as unknown as StoreSpecificValuesMap;
}

describe('getReplacedValuesMap', () => {
  test('return original', async () => {
    const newValue = 'abc123';
    const actual = getReplacedValuesMap(
      {
        [MOCK_UPCS[0]]: newValue,
      },
      {}
    );
    expect(actual).toStrictEqual({});
  });
  test('works', async () => {
    const newValue = 'abc123';
    const newValue2 = 'abc1234';
    const newValue3 = 'abc12356';
    const actual = getReplacedValuesMap(
      {
        [MOCK_UPCS[0]]: newValue,
        [MOCK_UPCS[1]]: newValue2,
        [MOCK_UPCS[2]]: newValue3,
      },
      getMockMap()
    );

    expect(actual).toStrictEqual({
      [newValue]: MOCK_VALUE,
      [newValue2]: MOCK_VALUE,
      [newValue3]: MOCK_VALUE,
    });
  });
});
