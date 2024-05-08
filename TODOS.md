## MVP
- Add the option to enter a username and password inside the react-native app for items/stores/etc:
    - This would allow users to easily grab items associated with themselves
    - The bff would have to have a way to validate whether the associated username and password are correct by making a quick call to the mongoDB (maybe add a new collection called 'Passwords' which is a Map with username as key and the encrypted password as value?)
    - The frontend would have a way to view data and sync it to the redux store