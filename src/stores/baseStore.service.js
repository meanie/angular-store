
/**
 * Module definition and dependencies
 */
angular.module('Store.BaseStore.Service', [])

/**
 * Base store
 */
.factory('$baseStore', function $baseStore($q, $log, $injector) {

  /**
   * Helper to validate a model
   */
  function validateModel(item, Model, convert) {
    if (item instanceof Model) {
      return item;
    }
    if (convert && typeof item === 'object') {
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
    let Model = null;
    Object.defineProperty(this, 'model', {
      get() {
        Model = Model || $injector.get(config.model);
        if (config.verbose) {
          $log.info('Resolved', config.model, 'model as', Model);
        }
        return Model;
      }
    });
  }

  /**
   * Check if an item is a valid model, optionally converting to a model
   */
  BaseStore.prototype.validateIsModel = function(item, convert) {

    //Handle array of items
    if (angular.isArray(item)) {
      let models = item
        .map(item => validateModel(item, this.model, convert))
        .filter(item => !!item);
      return $q.resolve(models);
    }

    //Handle single item
    let model = validateModel(item, this.model, convert);
    if (model !== null) {
      return $q.resolve(model);
    }
    $log.warn('Invalid object passed to', this.name, 'store as model:', item);
    return $q.reject('Invalid model');
  };

  //Return
  return BaseStore;
});
