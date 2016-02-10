
/**
 * Module definition and dependencies
 */
angular.module('Store.Service', [
  'Store.Types.Collection.Service',
  'Store.Types.Instance.Service'
])

/**
 * Model definition
 */
.provider('$store', function $storeProvider() {

  //Defaults
  this.defaults = {
    model: '',
    methods: null,

    //Type of store, either "collection" or "instance"
    type: 'collection'
  };

  //Registered stores
  this.collections = {};

  /**
   * Register a new store
   */
  this.registerStore = function(name, config) {
    if (name) {
      this.collections[name] = config || {};
    }
    return this;
  };

  /**
   * Service getter
   */
  this.$get = function($log, $storeCollection, $storeInstance) {

    //Initialize store interface
    var Store = function(store) {
      return this[store];
    };

    //Append all stores
    angular.forEach(this.collections, function(config, name) {

      //Warn if overwriting
      if (Store[name]) {
        $log.warn('Store', name, 'is being overwritten.');
      }

      //Extend store config with defaults
      config = angular.extend({}, this.defaults, config);

      //Initialize store
      if (config.type === 'collection') {
        Store[name] = $storeCollection(name, config);
      }
      else if (config.type === 'instance') {
        Store[name] = $storeInstance(name, config);
      }
      else {
        return $log.warn(
          'Unknown store type', config.type, 'specified for', name, 'store'
        );
      }

      //Extend with custom methods
      angular.extend(Store[name], config.methods || {});
    }, this);

    //Return
    return Store;
  };
});
