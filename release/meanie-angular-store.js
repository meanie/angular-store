/**
 * meanie-angular-store * https://github.com/meanie/angular-store
 *
 * Copyright (c) 2016 Adam Reis <adam@reis.nz>
 * License: MIT
 */
(function (window, angular, undefined) {
  'use strict';

  /**
   * Module definition and dependencies
   */

  angular.module('Store.Service', ['Store.BaseStore.Service', 'Store.CollectionStore.Service', 'Store.InstanceStore.Service'])

  /**
   * Model definition
   */
  .provider('$store', function $storeProvider() {

    //Defaults
    this.defaults = {
      model: '',
      methods: null,
      service: '$collectionStore',
      verbose: false
    };

    //Registered stores
    this.collections = {};

    /**
     * Set verbose
     */
    this.setVerbose = function (verbose) {
      this.defaults.verbose = !!verbose;
      return this;
    };

    /**
     * Register a new store
     */
    this.registerStore = function (name, config) {
      if (name) {
        this.collections[name] = config || {};
      }
      return this;
    };

    /**
     * Service getter
     */
    this.$get = ['$log', '$injector', function ($log, $injector) {

      //Initialize store interface
      var Store = function Store(store) {
        return this[store];
      };

      //Append all stores
      angular.forEach(this.collections, function (config, name) {

        //Extend store config with defaults
        config = angular.extend({}, this.defaults, config);

        //Verbose info
        if (config.verbose) {
          $log.info('Store', name + ':', config);
        }

        //Make sure we have a valid store service
        if (!config.service || !$injector.has(config.service)) {
          return $log.error('Unknown service', config.service, 'specified for', name, 'store');
        }

        //Make sure we have a valid model specified
        if (!config.model || !$injector.has(config.model)) {
          return $log.error('Unknown model specified for', name, 'store:', config.model);
        }

        //Initialize store
        var StoreService = $injector.get(config.service);
        var StoreInstance = new StoreService(name, config);

        //Check if overwriting
        if (Store[name]) {
          $log.warn('Store', name, 'is being overwritten.');
        }

        //Set
        Store[name] = StoreInstance;
      }, this);

      //Return
      return Store;
    }];
  });
})(window, window.angular);
var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

(function (window, angular, undefined) {
  'use strict';

  /**
   * Module definition and dependencies
   */

  angular.module('Store.BaseStore.Service', [])

  /**
   * Base store
   */
  .factory('$baseStore', ['$q', '$log', '$injector', function $baseStore($q, $log, $injector) {

    /**
     * Helper to validate a model
     */
    function validateModel(item, Model, convert) {
      if (item instanceof Model) {
        return item;
      }
      if (convert && (typeof item === 'undefined' ? 'undefined' : _typeof(item)) === 'object') {
        return new Model(item);
      }
      return null;
    }

    /**
     * Constructor
     */
    function BaseStore(name, config) {

      //Defaults
      this.name = name;
      this.config = config;

      //Create dynamic model property to bypass injector circular dependency
      var Model = null;
      Object.defineProperty(this, 'model', {
        get: function get() {
          Model = Model || $injector.get(config.model);
          return Model;
        }
      });
    }

    /**
     * Method warning logger
     */
    BaseStore.prototype.warnMissingMethod = function (method) {
      $log.warn('No static `' + method + '` method present on model for', this.name, 'store');
    };

    /**
     * Check if an item is a valid model, optionally converting to a model
     */
    BaseStore.prototype.validateIsModel = function (item, convert) {
      var _this = this;

      //Handle array of items
      if (angular.isArray(item)) {
        var models = item.map(function (item) {
          return validateModel(item, _this.model, convert);
        }).filter(function (item) {
          return !!item;
        });
        return $q.resolve(models);
      }

      //Handle single item
      var model = validateModel(item, this.model, convert);
      if (model !== null) {
        return $q.resolve(model);
      }
      $log.warn('Invalid object passed to', this.name, 'store as model:', item);
      return $q.reject('Invalid model');
    };

    //Return
    return BaseStore;
  }]);
})(window, window.angular);
(function (window, angular, undefined) {
  'use strict';

  /**
   * Module definition and dependencies
   */

  angular.module('Store.CollectionStore.Service', ['Store.BaseStore.Service'])

  /**
   * Collection store factory
   */
  .factory('$collectionStore', ['$q', '$log', '$baseStore', function $collectionStore($q, $log, $baseStore) {

    /**
     * Constructor
     */
    function CollectionStore(name, config) {

      //Call parent constructor
      $baseStore.call(this, name, config);

      //Prepare collection
      this.collection = new Map();
      this.isLoaded = false;
    }

    /**
     * Extend prototype
     */
    angular.extend(CollectionStore.prototype, $baseStore.prototype);

    /**
     * Query items from model
     */
    CollectionStore.prototype.query = function (filter, refresh) {
      var _this = this;

      //Boolean passed as filter? Assume it's the refresh parameter
      if (typeof filter === 'boolean') {
        refresh = filter;
        filter = null;
      }

      //Loaded already?
      if (this.isLoaded && !filter && !refresh) {
        return $q.resolve(Array.from(this.collection.values()));
      }

      //Ensure method exists on model
      if (!angular.isFunction(this.model.query)) {
        this.warnMissingMethod('query');
        return $q.resolve([]);
      }

      //Query from server
      return this.model.query(filter).then(function (items) {

        //Add the items
        items.forEach(function (item) {
          return _this.add(item);
        });

        //If this wasn't a filter query, mark as loaded
        if (!filter) {
          _this.isLoaded = true;
        }

        //Return the items
        return items;
      });
    };

    /**
     * Clear the store
     */
    CollectionStore.prototype.clear = function () {
      this.collection.clear();
      this.isLoaded = false;
      return $q.resolve();
    };

    /**
     * Check if has item by ID
     */
    CollectionStore.prototype.has = function (id) {
      return this.collection.has(id);
    };

    /**
     * Find item by ID
     */
    CollectionStore.prototype.findById = function (id, refresh) {
      var _this2 = this;

      //Present and don't want to refresh?
      if (!refresh && this.collection.has(id)) {
        return $q.resolve(this.collection.get(id));
      }

      //Ensure method exists on model
      if (!angular.isFunction(this.model.findById)) {
        this.warnMissingMethod('findById');
        return $q.resolve(null);
      }

      //Find on server
      return this.model.findById(id).then(function (item) {
        return _this2.add(item);
      });
    };

    /**
     * Save item (create or update)
     */
    CollectionStore.prototype.save = function (item, data) {
      var _this3 = this;

      return this.validateIsModel(item, true).then(function (item) {
        return item.save(data);
      }).then(function (item) {
        return _this3.add(item);
      });
    };

    /**
     * Delete item
     */
    CollectionStore.prototype.delete = function (item) {
      var _this4 = this;

      return this.validateIsModel(item).then(function (item) {
        return item.delete();
      }).then(function (item) {
        return _this4.remove(item);
      });
    };

    /**
     * Load items into store manually
     */
    CollectionStore.prototype.load = function (items) {
      var _this5 = this;

      items = items || [];
      return this.validateIsModel(items, true).then(function (items) {
        return _this5.add(items);
      }).finally(function () {
        _this5.isLoaded = true;
      });
    };

    /**************************************************************************
     * Helper methods
     ***/

    /**
     * Add item to store (without creating on server)
     */
    CollectionStore.prototype.add = function (item) {
      var _this6 = this;

      if (angular.isArray(item)) {
        item.forEach(function (item) {
          return _this6.collection.set(item.id, item);
        });
      } else {
        if (typeof item.id === 'undefined') {
          $log.warn('Trying to add item to', this.name, ' store,', 'but no `id` property present on item:', item);
          return $q.reject();
        }
        this.collection.set(item.id, item);
      }
      return $q.resolve(item);
    };

    /**
     * Remove item from store (without deleting from server)
     */
    CollectionStore.prototype.remove = function (item) {
      var _this7 = this;

      if (angular.isArray(item)) {
        item.forEach(function (item) {
          return _this7.collection.delete(item.id);
        });
      } else {
        if (typeof item.id === 'undefined') {
          $log.warn('Trying to remove item from', this.name, ' store,', 'but no `id` property present on item:', item);
          return $q.reject();
        }
        this.collection.delete(item.id);
      }
      return $q.resolve(item);
    };

    //Return
    return CollectionStore;
  }]);
})(window, window.angular);
(function (window, angular, undefined) {
  'use strict';

  /**
   * Module definition and dependencies
   */

  angular.module('Store.InstanceStore.Service', ['Store.BaseStore.Service'])

  /**
   * Instance store factory
   */
  .factory('$instanceStore', ['$q', '$log', '$baseStore', function $instanceStore($q, $log, $baseStore) {

    /**
     * Constructor
     */
    function InstanceStore(name, config) {

      //Call parent constructor
      $baseStore.call(this, name, config);

      //Prepare instance and promise placeholders
      this.instance = null;
      this.promise = null;
    }

    /**
     * Extend prototype
     */
    angular.extend(InstanceStore.prototype, $baseStore.prototype);

    /**
     * Get single instance from store
     */
    InstanceStore.prototype.get = function (refresh) {
      var _this = this;

      //Already present?
      if (this.instance && !refresh) {
        return $q.resolve(this.instance);
      }

      //Promise present?
      if (this.promise) {
        return this.promise;
      }

      //Ensure method exists on model
      if (!angular.isFunction(this.model.get)) {
        this.warnMissingMethod('get');
        return $q.resolve([]);
      }

      //Get from server
      this.promise = this.model.get().then(function (instance) {
        return _this.instance = instance;
      }).finally(function () {
        return _this.promise = null;
      });

      //Return promise
      return this.promise;
    };

    /**
     * Set single instance in the store
     */
    InstanceStore.prototype.set = function (instance) {
      var _this2 = this;

      return this.validateIsModel(instance, true).then(function (instance) {
        return _this2.instance = instance;
      });
    };

    /**
     * Clear the store
     */
    InstanceStore.prototype.clear = function () {
      this.instance = null;
      return $q.resolve();
    };

    /**
     * Save item (create or update)
     */
    InstanceStore.prototype.save = function (item, data) {
      return this.validateIsModel(item, true).then(function (item) {
        return item.save(data);
      });
    };

    //Return
    return InstanceStore;
  }]);
})(window, window.angular);