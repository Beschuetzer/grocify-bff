import {
  StoreSpecificValueKey,
  StoreSpecificValues,
  StoreSpecificValuesMap,
} from "../types";
import { getUpdateObjectForStoreSpecificValues } from "./getUpdateObjectForStoreSpecificValues";

const MOCK_UPCS = [
  "000000000001",
  "000000000002",
  "000000000003",
  "000000000004",
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
    expect(actual).toEqual([
      ["000000000001.aisleNumber.target", targetAisleNumber],
      ["000000000001.aisleNumber.costco", costcoAisleNumber],
      ["000000000001.itemId.target", targetItemId],
      ["000000000001.isInCart.target", targetIsInCart],
      ["000000000001.price.target", targetPrice],
      ["000000000001.quantity.target",targetQuantity],
      ["000000000002.aisleNumber.target", targetAisleNumber],
      ["000000000002.aisleNumber.costco", costcoAisleNumber],
      ["000000000002.aisleNumber.walmart", walmartAisleNumber],
      ["000000000002.itemId.target", targetItemId],
      ["000000000002.itemId.walmart", walmartItemId],
      ["000000000002.isInCart.target", targetIsInCart],
      ["000000000002.isInCart.walmart", walmartIsInCart],
      ["000000000002.price.target", targetPrice],
      ["000000000002.price.walmart", walmarttPrice],
      ["000000000002.quantity.target",targetQuantity],
      ["000000000002.quantity.walmart", walmartQuantity],
    ]);
  });
});
