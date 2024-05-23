## MVP
- add isAuthenticated middleware
- finish /user put request
- update the frontend service to match the new routes for user and item
- add mock endpoint that takes number of items to generate and a username and password
- add endpoint that gets all of the items the user can access based on username and password inputs (any items without a password )
- Add the option to enter a username and password inside the react-native app for items/stores/etc:
    - This would allow users to easily grab items associated with themselves
    - The bff would have to have a way to validate whether the associated username and password are correct by making a quick call to the mongoDB (maybe add a new collection called 'Passwords' which is a Map with username as key and the encrypted password as value?)
    - The frontend would have a way to view data and sync it to the redux store

-Is it possible to store custom images as strings someone in mongo db or would a bucket be required?