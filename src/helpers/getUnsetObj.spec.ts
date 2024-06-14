import { storeSpecificValuesSchemaValueFieldName } from '../schema/storeSpecificValues';
import { getUnsetObj } from './getUnsetObj'

const MOCK_IDS = [
    "a9651944-362d-4579-8638-cadc137ce378",
    "a9611944-362d-4579-8638-cadc137ce378",
    "a9621944-362d-4579-8638-cadc137ce378",
    "a9631944-362d-4579-8638-cadc137ce378",
]
describe('getUnsetObj', () => {
    test ('can handle falsy', () => {
        const actual = getUnsetObj([]);
        expect(actual).toStrictEqual({})
    });
    test('works', () => {
        const actual = getUnsetObj(MOCK_IDS);
        expect(actual).toStrictEqual({
            [`${storeSpecificValuesSchemaValueFieldName}.${MOCK_IDS[0]}`]: 1,
            [`${storeSpecificValuesSchemaValueFieldName}.${MOCK_IDS[1]}`]: 1,
            [`${storeSpecificValuesSchemaValueFieldName}.${MOCK_IDS[2]}`]: 1,
            [`${storeSpecificValuesSchemaValueFieldName}.${MOCK_IDS[3]}`]: 1,
        })
    })
})