## MVP
- save all:
    --finish the user/saveAll endpoint (do we want to save upcProducts since they are fetched externally?)

- finish store saving stuff:
    --test saving an item with the current schema (do i need to specify the objects for gpsCoordinates and address?)
    --finish store.ts routes (and test)

- create an endpoint to save everything:
    --figure out saving stores first
    --remove POST item/many
    --create new endpoint that saves everything all in one go

- finish POST item/many (or create a an endpoint to save everything) (make sure store specific)
    -- need to refactor handleStoreSpecificValuesMap to take the result of :
    getReplacedValuesMap({
    [keys[0]]: itemId
  }, storeSpecificValuesToAdd); This way the endpoint can pass in the correct map to use for the store specific values obj
- deleting a user account should also delete all the items and the store specific values info

- figure out how to create the item id on the backend (need to remove the functionality from frontend and change the logic around whether to call PUT/POST in saveItem).

-how is no network connectivity handles with saving?

- figure out update item case for store specific values:
    -- need to make sure that fields are deleted in store specific values object when the key changes for an item and the new key is added with all of the current values
    -- use item ids for the storeSpecificValues key field (instead of getKeyToUse)?
    -- if this ends up not working just have a document for each itemId and userId combination with the store specific values

- update the frontend service to match the new routes for user and item
- add mock endpoint that takes number of items to generate and a username and password
- add endpoint that gets all of the items the user can access based on username and password inputs (any items without a password )
- Add the option to enter a username and password inside the react-native app for items/stores/etc:
    - This would allow users to easily grab items associated with themselves
    - The bff would have to have a way to validate whether the associated username and password are correct by making a quick call to the mongoDB (maybe add a new collection called 'Passwords' which is a Map with username as key and the encrypted password as value?)
    - The frontend would have a way to view data and sync it to the redux store

## Post MVP
-add stripe integration
    --make sure a user account can only be created if a payment has been received

-Is it possible to store custom images as strings someone in mongo db or would a bucket be required?

-security things:
    --limit the number of times a user can try to login (POST user/login) to 3 times a minute