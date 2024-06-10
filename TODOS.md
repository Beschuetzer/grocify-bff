## MVP
- figure out handleStoreSpecificValues():  
    --create a separate function called getUpdateObjectForStoreSpecificValues(), which maps the storeSpecificValues to an object which can be used to update the object with the news values
    -- use try/catch and try updating only the new fields via  await StoreSpecificValuesSchema.updateOne({userId}, {
        "values.400601364519.aisleNumber.target": 987
        ...
      })
    -- if it fails, that means that the item should be created from scratch?

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