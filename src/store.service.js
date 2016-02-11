
/**
 * Module definition and dependencies
 */
angular.module('Store.Service', [
  'Store.BaseStore.Service',
  'Store.CollectionStore.Service',
  'Store.InstanceStore.Service'
])

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
  this.setVerbose = function(verbose) {
    this.defaults.verbose = !!verbose;
    return this;
  };

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
  this.$get = function($log, $injector) {

    //Initialize store interface
    var Store = function(store) {
      return this[store];
    };

    //Append all stores
    angular.forEach(this.collections, function(config, name) {

      //Extend store config with defaults
      config = angular.extend({}, this.defaults, config);

      //Verbose info
      if (config.verbose) {
        $log.info('Setting up', name, 'store with config', config);
      }

      //Make sure we have a valid store service
      if (!config.service || !$injector.has(config.service)) {
        return $log.error(
          'Unknown service', config.service, 'specified for', name, 'store'
        );
      }

      //Make sure we have a valid model specified
      if (!config.model || !$injector.has(config.model)) {
        return $log.error(
          'Unknown model specified for', name, 'store:', config.model
        );
      }

      //Initialize store
      let StoreService = $injector.get(config.service);
      let StoreInstance = new StoreService(name, config);

      //Check if overwriting
      if (Store[name]) {
        $log.warn('Store', name, 'is being overwritten.');
      }

      //Set
      Store[name] = StoreInstance;
    }, this);

    //Return
    return Store;
  };
});
