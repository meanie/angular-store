# @meanie/angular-store

[![npm version](https://img.shields.io/npm/v/@meanie/angular-store.svg)](https://www.npmjs.com/package/@meanie/angular-store)
[![node dependencies](https://david-dm.org/meanie/angular-store.svg)](https://david-dm.org/meanie/angular-store)
[![github issues](https://img.shields.io/github/issues/meanie/angular-store.svg)](https://github.com/meanie/angular-store/issues)
[![codacy](https://img.shields.io/codacy/8750e5a072ad45bfbd1cec8dfe415f9a.svg)](https://www.codacy.com/app/meanie/angular-store)


An Angular service for managing model instances

![Meanie](https://raw.githubusercontent.com/meanie/meanie/master/meanie-logo-full.png)

## Installation

You can install this package using `yarn` or `npm`:

```shell
#yarn
yarn add @meanie/angular-store

#npm
npm install @meanie/angular-store --save
```

Include the script `node_modules/@meanie/angular-store/release/angular-store.js` in your build process, or add it via a `<script>` tag to your `index.html`:

```html
<script src="node_modules/@meanie/angular-store/release/angular-store.js"></script>
```

Add `Store.Service` as a dependency for your app.

## Usage
Please note that this service is best used in conjunction with the [Meanie Angular API](https://github.com/meanie/angular-api) service and models derived from `$baseModel`.

The store service comes with two predefined store classes that you can use, the `$collectionStore` and the `$instanceStore`. You can also extend these services and create your own store service for a specific model, or derive one from the `$baseStore`.

All store methods return promises so they are ideal for chaining and post handling of model instances, and can be used to resolve data in your routes.

### Collection store
The collection store is used to manage a collection of models. It requires the following methods present on your model (each returning a promise):

* `Model.query(filter).then(items => ...)`
* `Model.prototype.save(data).then(item => ...)`
* `Model.prototype.delete().then(item => ...)`

Furthermore, it requires that each instance of your data has a unique `id` property by which the store will track your items.

```js
angular.module('App.MyModule', [
  'Store.Service'
])

//Register a new store
.config(function($storeProvider) {
  $storeProvider.registerStore('users', {
    model: 'User',
    service: '$collectionStore' //default, can be omitted
  });
})

//Use in your app
.controller('MyController', function($store) {

  //Query users
  $store.users.query()
    .then(users => ...);

  //Find a specific user
  $store.users.findByid(1)
    .then(user => ...)

  //Save a user instance
  $store.users.save(user)
    .then(user => ...);

  //Delete a user instance
  $store.users.delete(user)
    .then(user => ...);

  //Create a new user model instance from plain object
  $store.users.save({name: 'Meanie'})
    .then(user => ...)

  //Clear the users from the store
  $store.users.clear();

  //Load a predefined set of users (or plain user data) to the store
  //Converts them to models if plain data objects given
  $store.users.load([{name: 'A'}, {name: 'B'}])
    .then(users => ...);

  //Add instance to the store manually (without saving on server)
  $store.users.add(new User({name: 'C'}))
    .then(user => ...);

  //Remove user instance from the store manually (without deleting from server)
  $store.users.remove(user)
    .then(user => ...);
});
```

### Instance store
The instance store is used to manage a single model, for example the logged in user. It requires the following methods present on your model (each returning a promise):

* `Model.get().then(item => ...)`
* `Model.prototype.save().then(item => ...)`

```js
angular.module('App.MyModule', [
  'Store.Service'
])

//Register a new store
.config(function($storeProvider) {
  $storeProvider.registerStore('user', {
    model: 'User',
    service: '$instanceStore'
  });
})

//Use in your app
.controller('MyController', function($store) {

  //Get the user instance
  $store.user.get()
    .then(user => ...);

  //Save the user instance
  $store.user.save(user);

  //Create a new user model instance from plain object
  $store.user.save({name: 'Meanie'})
    .then(user => ...);

  //Set a user instance manually
  $store.user.set(new User({name: 'Meanie'}))
    .then(user => ...);

  //Also works with plain data
  $store.user.set({name: 'Meanie'})
    .then(user => ...);

  //Clear the user
  $store.user.clear()
    .then(user => ...);
});
```

### Custom store

```js
angular.module('UserStore.Service', [
  'Store.Store.Service'
])

//Register a new store
.config(function($storeProvider) {
  $storeProvider.registerStore('users', {
    model: 'User',
    service: 'UserStore'
  });
})

//Factory for store
.factory('UserStore', function($collectionStore) {

  /**
   * Constructor
   */
  function UserStore(name, config) {
    $collectionStore.call(this, name, config);
  }

  /**
   * Extend prototype
   */
  angular.extend(UserStore.prototype, $collectionStore.prototype);

  /**
   * Extend with custom methods as needed
   */
  UserStore.prototype.findByName = function(name) {
    return this.query({
      name: name
    });
  };

  //Return
  return UserStore;
});
```

## Issues & feature requests

Please report any bugs, issues, suggestions and feature requests in the [@meanie/angular-store issue tracker](https://github.com/meanie/angular-store/issues).

## Contributing

Pull requests are welcome! If you would like to contribute to Meanie, please check out the [Meanie contributing guidelines](https://github.com/meanie/meanie/blob/master/CONTRIBUTING.md).

## Credits

* Meanie logo designed by [Quan-Lin Sim](mailto:quan.lin.sim+meanie@gmail.com)

## License
(MIT License)

Copyright 2016-2017, [Adam Reis](https://adam.reis.nz)
