
/**
 * Module definition and dependencies
 */
angular.module('Store.Types.Collection.Service', [])

/**
 * Collection store factory
 */
.factory('$storeCollection', function $storeCollection($q, $log, $injector) {

  /**
   * Constructor
   */
  function StoreCollection(name, config) {

    //Defaults
    this.model = null;
    this.collection = new Map();
    this.loaded = false;
    this.name = name;
    this.config = config;

    //Get model
    if (config.model) {
      if ($injector.has(config.model)) {
        this.model = $injector.get(config.model);
      }
      else {
        $log.warn('Unknown model specified for', name, 'store:', config.model);
      }
    }
  }

  /**
   * Query items from model
   */
  StoreCollection.prototype.query = function(filter, refresh) {

    //Loaded already?
    if (this.loaded && !refresh) {
      return $q.resolve(Array.from(this.collection.values()));
    }

    //Query from server
    return this.model.query(filter)
      .then(items => {
        items.forEach(item => this.add(item));
        this.loaded = true;
        return items;
      });
  };

  /**
   * Clear the store
   */
  StoreCollection.prototype.clear = function() {
    this.collection.clear();
    return $q.resolve();
  };

  /**
   * Find item by ID
   */
  StoreCollection.prototype.findById = function(id) {

    //Present?
    if (this.collection.has(id)) {
      return $q.resolve(this.collection.get(id));
    }

    //Find on server
    return this.model.findById(id).then(item => this.add(item));
  };

  /**
   * Save item (create or update)
   */
  StoreCollection.prototype.save = function(item, data) {
    return this.validateIsModel(item, true)
      .then(item => item.save(data))
      .then(item => this.add(item));
  };

  /**
   * Delete item
   */
  StoreCollection.prototype.delete = function(item) {
    return this.validateIsModel(item)
      .then(item => item.delete())
      .then(item => this.remove(item));
  };

  /**************************************************************************
   * Helper methods
   ***/

  /**
   * Add item to store (without creating on server)
   */
  StoreCollection.prototype.add = function(item) {
    this.collection.set(item.id, item);
    return $q.resolve(item);
  };

  /**
   * Remove item from store (without deleting from server)
   */
  StoreCollection.prototype.remove = function(item) {
    this.collection.delete(item.id);
    return $q.resolve(item);
  };

  /**
   * Check if an item is a valid model, optionally converting to a model
   */
  StoreCollection.prototype.validateIsModel = function(item, convert) {
    if (item instanceof this.model) {
      return $q.resolve(item);
    }
    if (convert && typeof item === 'object') {
      return $q.resolve(new this.model(item));
    }
    $log.warn('Invalid object passed to', this.name, 'store as model:', item);
    return $q.reject('Invalid model');
  };

  //Return factory function
  return function(name, config) {
    return new StoreCollection(name, config);
  };
});
