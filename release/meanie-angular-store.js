/**
 * meanie-angular-store - v1.0.1 - 10-1-2016
 * https://github.com/meanie/angular-store
 *
 * Copyright (c) 2016 Adam Buczynski <me@adambuczynski.com>
 * License: MIT
 */
'use strict';

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
      service: '$collectionStore'
    };

    //Registered stores
    this.collections = {};

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
'use strict';

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
'use strict';

(function (window, angular, undefined) {
  'use strict';

  /**
   * Module definition and dependencies
   */

  angular.module('Store.CollectionStore.Service', ['Store.BaseStore.Service'])

  /**
   * Collection store factory
   */
  .factory('$collectionStore', ['$q', '$baseStore', function $collectionStore($q, $baseStore) {

    /**
     * Constructor
     */
    function CollectionStore(name, config) {

      //Call parent constructor
      $baseStore.call(this, name, config);

      //Prepare collection
      this.collection = new Map();
      this.loaded = false;
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

      //Loaded already?
      if (this.loaded && !filter && !refresh) {
        return $q.resolve(Array.from(this.collection.values()));
      }

      //Query from server
      return this.model.query(filter).then(function (items) {
        items.forEach(function (item) {
          return _this.add(item);
        });
        _this.loaded = true;
        return items;
      });
    };

    /**
     * Clear the store
     */
    CollectionStore.prototype.clear = function () {
      this.collection.clear();
      return $q.resolve();
    };

    /**
     * Find item by ID
     */
    CollectionStore.prototype.findById = function (id) {
      var _this2 = this;

      //Present?
      if (this.collection.has(id)) {
        return $q.resolve(this.collection.get(id));
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
        return _this5.isLoaded = true;
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
        this.collection.delete(item.id);
      }
      return $q.resolve(item);
    };

    //Return
    return CollectionStore;
  }]);
})(window, window.angular);
'use strict';

(function (window, angular, undefined) {
  'use strict';

  /**
   * Module definition and dependencies
   */

  angular.module('Store.InstanceStore.Service', ['Store.BaseStore.Service'])

  /**
   * Instance store factory
   */
  .factory('$instanceStore', ['$q', '$baseStore', function $instanceStore($q, $baseStore) {

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