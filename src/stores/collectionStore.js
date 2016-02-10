
/**
 * Module definition and dependencies
 */
angular.module('Store.CollectionStore.Service', [
  'Store.BaseStore.Service'
])

/**
 * Collection store factory
 */
.factory('$collectionStore', function $collectionStore($q, $baseStore) {

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
  CollectionStore.prototype.query = function(filter, refresh) {

    //Loaded already?
    if (this.loaded && !filter && !refresh) {
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
  CollectionStore.prototype.clear = function() {
    this.collection.clear();
    return $q.resolve();
  };

  /**
   * Find item by ID
   */
  CollectionStore.prototype.findById = function(id) {

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
  CollectionStore.prototype.save = function(item, data) {
    return this.validateIsModel(item, true)
      .then(item => item.save(data))
      .then(item => this.add(item));
  };

  /**
   * Delete item
   */
  CollectionStore.prototype.delete = function(item) {
    return this.validateIsModel(item)
      .then(item => item.delete())
      .then(item => this.remove(item));
  };

  /**
   * Load items into store manually
   */
  CollectionStore.prototype.load = function(items) {
    items = items || [];
    return this.validateIsModel(items, true)
      .then(items => this.add(items))
      .finally(() => (this.isLoaded = true));
  };

  /**************************************************************************
   * Helper methods
   ***/

  /**
   * Add item to store (without creating on server)
   */
  CollectionStore.prototype.add = function(item) {
    if (angular.isArray(item)) {
      item.forEach(item => this.collection.set(item.id, item));
    }
    else {
      this.collection.set(item.id, item);
    }
    return $q.resolve(item);
  };

  /**
   * Remove item from store (without deleting from server)
   */
  CollectionStore.prototype.remove = function(item) {
    if (angular.isArray(item)) {
      item.forEach(item => this.collection.delete(item.id));
    }
    else {
      this.collection.delete(item.id);
    }
    return $q.resolve(item);
  };

  //Return
  return CollectionStore;
});
