import { storeSpecificValuesSchemaValueFieldName } from "../schema/storeSpecificValues";
import { getUpdateObjectForValuesDocument } from './getUpdateObjectForValuesDocument'
import { StoreSpecificValueKey } from "../types";
import { sanitize } from '.'

const MOCK_UPCS = [
  "000000000001",
  "000000000002",
];

const targetAisleNumber = 321;
const costcoAisleNumber = 554;
const walmartAisleNumber = 231;
const targetItemId = "abc123";
const walmartItemId = "abc12345";
const targetIsInCart = true;
const walmartIsInCart = false;
const targetPrice = 3.88;
const walmarttPrice = 3.99;
const targetQuantity = 2;
const walmartQuantity = 99;
const storeNameWithDots = 'target in n. st. paul';
const keyWithDots = 'Some_Key.With.Dots';

describe("getUpdateObjectForValuesDocument", () => {
  test("empty returns empty", async () => {
    const actual = getUpdateObjectForValuesDocument({} as any);
    expect(actual).toStrictEqual([]);
  });
  test("falsy returns empty", async () => {
    const actual = getUpdateObjectForValuesDocument(undefined as any);
    expect(actual).toStrictEqual([]);
  });

  test("can handle falsy key", async () => {
    const actual = getUpdateObjectForValuesDocument({
      [keyWithDots]: {
        [StoreSpecificValueKey.IsInCart]: {
          [""]: targetIsInCart,
        },
      },
    })
    expect(actual).toStrictEqual({})
  })


  test("can escape . in key", async () => {
    const actual = getUpdateObjectForValuesDocument({
      [keyWithDots]: {
        [StoreSpecificValueKey.AisleNumber]: {
          [storeNameWithDots]: targetAisleNumber,
        },
        [StoreSpecificValueKey.ItemId]: {
          [storeNameWithDots]: targetItemId,
        },
        [StoreSpecificValueKey.IsInCart]: {
          [storeNameWithDots]: targetIsInCart,
        },
        [StoreSpecificValueKey.Price]: {
          [storeNameWithDots]: targetPrice,
        },
        [StoreSpecificValueKey.Quantity]: {
          [storeNameWithDots]: targetQuantity,
        },
      },
      [storeNameWithDots]: {
        [StoreSpecificValueKey.AisleNumber]: {
          [storeNameWithDots]: targetAisleNumber,
        },
        [StoreSpecificValueKey.ItemId]: {
          [storeNameWithDots]: targetItemId,
        },
        [StoreSpecificValueKey.IsInCart]: {
          [storeNameWithDots]: targetIsInCart,
        },
        [StoreSpecificValueKey.Price]: {
          [storeNameWithDots]: targetPrice,
        },
        [StoreSpecificValueKey.Quantity]: {
          [storeNameWithDots]: targetQuantity,
        },
      }
    })
    expect(actual).toEqual({
      [`${storeSpecificValuesSchemaValueFieldName}.${sanitize(keyWithDots)}.${StoreSpecificValueKey.AisleNumber}.${sanitize(storeNameWithDots)}`]: targetAisleNumber,
      [`${storeSpecificValuesSchemaValueFieldName}.${sanitize(keyWithDots)}.${StoreSpecificValueKey.IsInCart}.${sanitize(storeNameWithDots)}`]: targetIsInCart,
      [`${storeSpecificValuesSchemaValueFieldName}.${sanitize(keyWithDots)}.${StoreSpecificValueKey.ItemId}.${sanitize(storeNameWithDots)}`]: targetItemId,
      [`${storeSpecificValuesSchemaValueFieldName}.${sanitize(keyWithDots)}.${StoreSpecificValueKey.Price}.${sanitize(storeNameWithDots)}`]: targetPrice,
      [`${storeSpecificValuesSchemaValueFieldName}.${sanitize(keyWithDots)}.${StoreSpecificValueKey.Quantity}.${sanitize(storeNameWithDots)}`]: targetQuantity,
      [`${storeSpecificValuesSchemaValueFieldName}.${sanitize(storeNameWithDots)}.${StoreSpecificValueKey.AisleNumber}.${sanitize(storeNameWithDots)}`]: targetAisleNumber,
      [`${storeSpecificValuesSchemaValueFieldName}.${sanitize(storeNameWithDots)}.${StoreSpecificValueKey.IsInCart}.${sanitize(storeNameWithDots)}`]: targetIsInCart,
      [`${storeSpecificValuesSchemaValueFieldName}.${sanitize(storeNameWithDots)}.${StoreSpecificValueKey.ItemId}.${sanitize(storeNameWithDots)}`]: targetItemId,
      [`${storeSpecificValuesSchemaValueFieldName}.${sanitize(storeNameWithDots)}.${StoreSpecificValueKey.Price}.${sanitize(storeNameWithDots)}`]: targetPrice,
      [`${storeSpecificValuesSchemaValueFieldName}.${sanitize(storeNameWithDots)}.${StoreSpecificValueKey.Quantity}.${sanitize(storeNameWithDots)}`]: targetQuantity,
    })
  });

  describe('StoreSpecificValues cases', () => {
    test("simple example", async () => {
      const actual = getUpdateObjectForValuesDocument({
        [MOCK_UPCS[0]]: {
          [StoreSpecificValueKey.AisleNumber]: {
            target: targetAisleNumber,
            costco: costcoAisleNumber,
          },
          [StoreSpecificValueKey.ItemId]: {
            target: targetItemId,
          },
          [StoreSpecificValueKey.IsInCart]: {
            target: targetIsInCart,
          },
          [StoreSpecificValueKey.Price]: {
            target: targetPrice,
          },
          [StoreSpecificValueKey.Quantity]: {
            target: targetQuantity,
          },
        },
        [MOCK_UPCS[1]]: {
          [StoreSpecificValueKey.AisleNumber]: {
            target: targetAisleNumber,
            costco: costcoAisleNumber,
            walmart: walmartAisleNumber,
          },
          [StoreSpecificValueKey.ItemId]: {
            target: targetItemId,
            walmart: walmartItemId,
          },
          [StoreSpecificValueKey.IsInCart]: {
            target: targetIsInCart,
            walmart: !targetIsInCart,
          },
          [StoreSpecificValueKey.Price]: {
            target: targetPrice,
            walmart: walmarttPrice,
          },
          [StoreSpecificValueKey.Quantity]: {
            target: targetQuantity,
            walmart: walmartQuantity,
          },
        },
      });
      expect(actual).toEqual({
        [`${storeSpecificValuesSchemaValueFieldName}.${MOCK_UPCS[0]}.aisleNumber.target`]: targetAisleNumber,
        [`${storeSpecificValuesSchemaValueFieldName}.${MOCK_UPCS[0]}.aisleNumber.costco`]: costcoAisleNumber,
        [`${storeSpecificValuesSchemaValueFieldName}.${MOCK_UPCS[0]}.itemId.target`]: targetItemId,
        [`${storeSpecificValuesSchemaValueFieldName}.${MOCK_UPCS[0]}.isInCart.target`]: targetIsInCart,
        [`${storeSpecificValuesSchemaValueFieldName}.${MOCK_UPCS[0]}.price.target`]: targetPrice,
        [`${storeSpecificValuesSchemaValueFieldName}.${MOCK_UPCS[0]}.quantity.target`]:targetQuantity,
        [`${storeSpecificValuesSchemaValueFieldName}.${MOCK_UPCS[1]}.aisleNumber.target`]: targetAisleNumber,
        [`${storeSpecificValuesSchemaValueFieldName}.${MOCK_UPCS[1]}.aisleNumber.costco`]: costcoAisleNumber,
        [`${storeSpecificValuesSchemaValueFieldName}.${MOCK_UPCS[1]}.aisleNumber.walmart`]: walmartAisleNumber,
        [`${storeSpecificValuesSchemaValueFieldName}.${MOCK_UPCS[1]}.itemId.target`]: targetItemId,
        [`${storeSpecificValuesSchemaValueFieldName}.${MOCK_UPCS[1]}.itemId.walmart`]: walmartItemId,
        [`${storeSpecificValuesSchemaValueFieldName}.${MOCK_UPCS[1]}.isInCart.target`]: targetIsInCart,
        [`${storeSpecificValuesSchemaValueFieldName}.${MOCK_UPCS[1]}.isInCart.walmart`]: walmartIsInCart,
        [`${storeSpecificValuesSchemaValueFieldName}.${MOCK_UPCS[1]}.price.target`]: targetPrice,
        [`${storeSpecificValuesSchemaValueFieldName}.${MOCK_UPCS[1]}.price.walmart`]: walmarttPrice,
        [`${storeSpecificValuesSchemaValueFieldName}.${MOCK_UPCS[1]}.quantity.target`]:targetQuantity,
        [`${storeSpecificValuesSchemaValueFieldName}.${MOCK_UPCS[1]}.quantity.walmart`]: walmartQuantity,
      });
    });
  })

  describe('LastPurchasedMap cases', () => {
    test("simple example", async () => {
      const now = Date.now();
      const oneSecondAgo = now - 1000;
      const actual = getUpdateObjectForValuesDocument({
        [MOCK_UPCS[0]]: {
          [storeNameWithDots]: now,
          [keyWithDots]: oneSecondAgo,
        },
        [MOCK_UPCS[1]]: {
          [storeNameWithDots]: now,
          [keyWithDots]: oneSecondAgo,
        },
      });
      expect(actual).toEqual({
        [`${storeSpecificValuesSchemaValueFieldName}.${MOCK_UPCS[0]}.${sanitize(storeNameWithDots)}`]: now,
        [`${storeSpecificValuesSchemaValueFieldName}.${MOCK_UPCS[0]}.${sanitize(keyWithDots)}`]: oneSecondAgo,
        [`${storeSpecificValuesSchemaValueFieldName}.${MOCK_UPCS[1]}.${sanitize(storeNameWithDots)}`]: now,
        [`${storeSpecificValuesSchemaValueFieldName}.${MOCK_UPCS[1]}.${sanitize(keyWithDots)}`]: oneSecondAgo,
      });
    });
  })
});
