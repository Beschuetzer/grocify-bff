import { getUpdateObjectForStoreSpecificValues } from "./getUpdateObjectForStoreSpecificValues";

describe('getUpdateObjectForStoreSpecificValues', () => {
    //todo: write tests for the actual use case and for more advanced cases
    test('it works', async () => {
        const actual = getUpdateObjectForStoreSpecificValues({} as any);
        expect(actual).toStrictEqual({})
    })
})
