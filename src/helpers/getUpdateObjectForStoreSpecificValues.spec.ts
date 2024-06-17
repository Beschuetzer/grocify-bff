import { storeSpecificValuesSchemaValueFieldName } from "../schema/storeSpecificValues";
import { StoreSpecificValueKey } from "../types";
import { getUpdateObjectForStoreSpecificValues } from "./getUpdateObjectForStoreSpecificValues";
import { sanitizeKeys } from '.'

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

describe("getUpdateObjectForStoreSpecificValues", () => {
  //todo: write tests for the actual use case and for more advanced cases
  test("empty returns empty", async () => {
    const actual = getUpdateObjectForStoreSpecificValues({} as any);
    expect(actual).toStrictEqual([]);
  });
  test("falsy returns empty", async () => {
    const actual = getUpdateObjectForStoreSpecificValues(undefined as any);
    expect(actual).toStrictEqual([]);
  });
  test("can escape . in store name", async () => {
    const actual = getUpdateObjectForStoreSpecificValues({
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
      }
    })
    expect(actual).toEqual({
      [`${storeSpecificValuesSchemaValueFieldName}.${sanitizeKeys(keyWithDots)}.${StoreSpecificValueKey.AisleNumber}.${sanitizeKeys(storeNameWithDots)}`]: targetAisleNumber,
      [`${storeSpecificValuesSchemaValueFieldName}.${sanitizeKeys(keyWithDots)}.${StoreSpecificValueKey.IsInCart}.${sanitizeKeys(storeNameWithDots)}`]: targetIsInCart,
      [`${storeSpecificValuesSchemaValueFieldName}.${sanitizeKeys(keyWithDots)}.${StoreSpecificValueKey.ItemId}.${sanitizeKeys(storeNameWithDots)}`]: targetItemId,
      [`${storeSpecificValuesSchemaValueFieldName}.${sanitizeKeys(keyWithDots)}.${StoreSpecificValueKey.Price}.${sanitizeKeys(storeNameWithDots)}`]: targetPrice,
      [`${storeSpecificValuesSchemaValueFieldName}.${sanitizeKeys(keyWithDots)}.${StoreSpecificValueKey.Quantity}.${sanitizeKeys(storeNameWithDots)}`]: targetQuantity,
    })
  });
  test("simple example", async () => {
    const actual = getUpdateObjectForStoreSpecificValues({
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
});
