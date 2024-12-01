export const BULK_WRITE_RESULT_DEFAULT = Object.freeze({
  result: {
    ok: 1,
    writeErrors: [],
    writeConcernErrors: [],
    insertedIds: [],
    nInserted: 0,
    nUpserted: 0,
    nMatched: 0,
    nModified: 0,
    nRemoved: 0,
    upserted: [],
  },
  insertedCount: 0,
  matchedCount: 0,
  modifiedCount: 0,
  deletedCount: 0,
  upsertedCount: 0,
  upsertedIds: {},
  insertedIds: {},
  n: 0,
});
export const BCRYPT_SALT_ROUND = 10;
export const DEFAULT_ITEM_NUMBER = 1;
export const DEFAULT_ITEM_UNIT = 'unit';
export const ERROR_MSG_NOT_AUTHORIZED = 'You are not authorized to do this';
export const EMPTY_STRING = '';
export const EMPTY_NUMBER = 0;
