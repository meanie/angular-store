
/**
 * Module definition and dependencies
 */
angular.module('Store.CollectionStore.Service', [
  'Store.BaseStore.Service',
])

/**
 * Collection store factory
 */
.factory('$collectionStore', function $collectionStore($q, $log, $baseStore) {

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
  CollectionStore.prototype.query = function(filter, refresh) {

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

    //Get data key from config
    const {dataKey} = this.config;

    //Query from server
    return this.model
      .query(filter)
      .then(data => {
        if (dataKey && Array.isArray(data[dataKey])) {
          return data[dataKey];
        }
        else if (Array.isArray(data)) {
          return data;
        }
        throw new Error(`Unexpected data format for ${this.name} store`);
      })
      .then(items => {

        //Add the items
        items.forEach(item => this.add(item));

        //If this wasn't a filter query, mark as loaded if we got any items
        if (!filter && items.length > 0) {
          this.isLoaded = true;
        }

        //Return the items
        return items;
      });
  };

  /**
   * Clear the store
   */
  CollectionStore.prototype.clear = function() {
    this.collection.clear();
    this.isLoaded = false;
    return $q.resolve();
  };

  /**
   * Check if has item by ID
   */
  CollectionStore.prototype.has = function(id) {
    return this.collection.has(id);
  };

  /**
   * Find item by ID
   */
  CollectionStore.prototype.findById = function(id, refresh) {

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
      .finally(() => {
        this.isLoaded = true;
      });
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
      if (typeof item.id === 'undefined') {
        $log.warn(
          'Trying to add item to', this.name, ' store,',
          'but no `id` property present on item:', item
        );
        return $q.reject();
      }
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
      if (typeof item.id === 'undefined') {
        $log.warn(
          'Trying to remove item from', this.name, ' store,',
          'but no `id` property present on item:', item
        );
        return $q.reject();
      }
      this.collection.delete(item.id);
    }
    return $q.resolve(item);
  };

  //Return
  return CollectionStore;
});
