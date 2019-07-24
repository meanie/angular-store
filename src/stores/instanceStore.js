
/**
 * Module definition and dependencies
 */
angular.module('Store.InstanceStore.Service', [
  'Store.BaseStore.Service',
])

/**
 * Instance store factory
 */
.factory('$instanceStore', function $instanceStore($q, $baseStore) {

  /**
   * Constructor
   */
  function InstanceStore(name, config) {

    //Call parent constructor
    $baseStore.call(this, name, config);

    //Prepare instance and promise placeholders
    this.instance = null;
    this.promise = null;
    this.cacheEmpty = config.cacheEmpty || false;
  }

  /**
   * Extend prototype
   */
  angular.extend(InstanceStore.prototype, $baseStore.prototype);

  /**
   * Get single instance from store
   */
  InstanceStore.prototype.get = function(filter, refresh) {

    //Boolean given as filter
    if (typeof filter === 'boolean') {
      refresh = filter;
      filter = null;
    }

    //Already present, or loaded but not present and allow empty caching?
    if ((this.instance || (this.isLoaded && this.cacheEmpty)) && !refresh) {
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
    this.promise = this.model
      .get(filter)
      .then(instance => {
        this.isLoaded = true;
        this.instance = instance;
        return instance;
      })
      .finally(() => this.promise = null);

    //Return promise
    return this.promise;
  };

  /**
   * Set single instance in the store
   */
  InstanceStore.prototype.set = function(instance) {
    return this.validateIsModel(instance, true)
      .then(instance => {
        this.isLoaded = true;
        this.instance = instance;
        return instance;
      })
  };

  /**
   * Clear the store
   */
  InstanceStore.prototype.clear = function() {
    this.instance = null;
    this.isLoaded = false;
    return $q.resolve();
  };

  /**
   * Save item (create or update)
   */
  InstanceStore.prototype.save = function(item, data) {
    return this.validateIsModel(item, true)
      .then(item => item.save(data));
  };

  //Return
  return InstanceStore;
});
