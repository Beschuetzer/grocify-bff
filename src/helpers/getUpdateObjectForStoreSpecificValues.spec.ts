import { getUpdateObjectForStoreSpecificValues } from "./getUpdateObjectForStoreSpecificValues";

describe('getUpdateObjectForStoreSpecificValues', () => {
    test('it works', async () => {
        const actual = getUpdateObjectForStoreSpecificValues();
        expect(actual).toStrictEqual({})
    })
})
