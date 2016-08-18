
/**
 * Module definition and dependencies
 */
angular.module('Store.InstanceStore.Service', [
  'Store.BaseStore.Service',
])

/**
 * Instance store factory
 */
.factory('$instanceStore', function $instanceStore($q, $log, $baseStore) {

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
  InstanceStore.prototype.get = function(refresh, fallback) {

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
    this.promise = this.model.get()
      .then(instance => (this.instance = instance))
      .catch(error => {
        if (fallback) {
          if (fallback === true) {
            let Model = this.model;
            fallback = new Model();
          }
          return $q.resolve(this.instance = fallback);
        }
        return $q.reject(error);
      })
      .finally(() => {
        this.promise = null;
      });

    //Return promise
    return this.promise;
  };

  /**
   * Set single instance in the store
   */
  InstanceStore.prototype.set = function(instance) {
    return this.validateIsModel(instance, true)
      .then(instance => (this.instance = instance));
  };

  /**
   * Clear the store
   */
  InstanceStore.prototype.clear = function() {
    this.instance = null;
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
