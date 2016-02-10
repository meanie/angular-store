
/**
 * Module definition and dependencies
 */
angular.module('Store.Types.Instance.Service', [])

/**
 * Instance store factory
 */
.factory('$storeInstance', function $storeInstance($q, $log, $injector) {

  /**
   * Constructor
   */
  function StoreInstance(name, config) {

    //Defaults
    this.model = null;
    this.instance = null;
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
   * Get single instance from store
   */
  StoreInstance.prototype.get = function(refresh) {

    //Already present?
    if (this.instance && !refresh) {
      return $q.resolve(this.instance);
    }

    //Get from server
    return this.model.get()
      .then(instance => (this.instance = instance));
  };

  /**
   * Set single instance in the store
   */
  StoreInstance.prototype.set = function(instance) {
    return $q.resolve((this.instance = instance));
  };

  /**
   * Clear the store
   */
  StoreInstance.prototype.clear = function() {
    this.instance = null;
    return $q.resolve();
  };

  /**
   * Save item (create or update)
   */
  StoreInstance.prototype.save = function(item, data) {
    return this.validateIsModel(item, true)
      .then(item => item.save(data));
  };

  /**
   * Delete item
   */
  StoreInstance.prototype.delete = function(item) {
    return this.validateIsModel(item)
      .then(item => item.delete());
  };

  /**************************************************************************
   * Helper methods
   ***/

  /**
   * Check if an item is a valid model, optionally converting to a model
   */
  StoreInstance.prototype.validateIsModel = function(item, convert) {
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
    return new StoreInstance(name, config);
  };
});
