import { storeSpecificValuesSchemaValueFieldName } from "../schema/storeSpecificValues";
import { StoreSpecificValueKey } from "../types";
import { getUpdateObjectForStoreSpecificValues } from "./getUpdateObjectForStoreSpecificValues";

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
