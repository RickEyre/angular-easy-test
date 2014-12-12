/**
 * Framework for making Angular Unit Test's easier to write.
 */
(function() {
  'use strict';

  /**
   * @class EasyTest
   */
  function EasyTest() {}

  /**
   * @function injectify
   * @memberof EasyTest
   * @description
   *
   * Injects a number of services and returns an object that has, as its
   * properties, the injected services.
   *
   * @param {array} injectibles An array of the names of the services to inject.
   *
   * @returns {object} An object that has, as its properties, the services that
   * were injected.
   *
   * @example
   * var services = EasyTest.injectify(['MyServiceOne', 'MyServiceTwo']);
   * expect(services.MyServiceOne).to.be.an.instanceOf(MyServiceOne);
   */
  EasyTest.injectify = function injectify(injectibles) {
    var obj = [];
    injectibles.push(function() {
      for (var i = 0, l = arguments.length; i < l; i++) {
        obj[injectibles[i]] = arguments[i];
      }
    });
    inject(injectibles);
    return obj;
  };

  /**
   * @memberof EasyTest
   * @description
   *
   * Mocks a specified module that has already been registered with angular.
   * Optionally registers a number of services with the mocked module.
   *
   * @param {string} moduleName The name of the module to mock.
   * @param {array} services An array of objects representing fake services to register
   * with the module. Each object must have a name property representing the
   * name of the service and a provider property which is the body of the
   * service, i.e. an object that has the functions and properties of the service.
   *
   * @example
   * // Mock MyModule and provide the passed fake services to it.
   * EasyTest.mockModule('MyModule', [{
   *   name: 'MyFakeServiceName', =
   *   provider: {
   *     get: function() {},
   *     name: 'ServiceName'
   *   }
   * }]);
   */
  EasyTest.mockModule = function mockModule(moduleName, services) {
    services = services || [];
    angular.mock.module(moduleName, function($provide) {
      services.forEach(function (service) {
        $provide.factory(service.name, [ function () {
          return service.provider;
        }]);
      });
    });
  };

  /**
   * @memberof EasyTest
   * @description
   *
   * Mocks a series of modules. The arguments that are passed into this function
   * can be passed in a very flexible manner. String arguments will be split
   * on their spaces and mocked directly, object arguments will be expected to
   * have a `name` property and `values` property which is an array of the
   * values to be provided for the module. See the {@link EasyTest.mockModule}
   * function for more information on how that works.
   *
   * @param {string|object} arguments A series of string or object parameters.
   *
   * @example
   * // Simply mock three modules
   * EasyTest.mockModules('one two three');
   * // or
   * EasyTest.mockModules('one two', 'three');
   * // etc, can mix and match.
   *
   * @example
   * // Mock two simple modules and a third with a fake service.
   * EasyTest.mockModules('one two', { name: 'three', values: [{
   *   name: 'FakeService',
   *   provider: { get: function() {} }
   * }]});
   */
  EasyTest.mockModules = function mockModules() {
    var modules =  Array.prototype.slice.call(arguments, 0);
    modules.forEach(function(arg) {
      if (typeof arg === 'string') {
        return arg.split(' ').forEach(function(moduleName) {
          angular.mock.module(moduleName); // Go directly to angular.mock
        });
      }
      EasyTest.mockModule(arg.name, arg.values);
    });
  };

  /**
   * @memberof EasyTest
   * @description
   *
   * Injects a specific service and returns a reference to it.
   *
   * @param {string} serviceName The name of the service to inject.
   *
   * @returns {object} The service that was injected.
   *
   * @example
   * var $q = EasyTest.getService('$q');
   */
  EasyTest.getService = function getService(serviceName) {
    return EasyTest.injectify([ serviceName ])[serviceName];
  };

  /**
   * @memberof EasyTest
   * @description
   *
   * Creates a 'test context' for a particular controller. Note that currently
   * you need to mock any modules that this controller may need beforehand.
   * See the {@link EasyTest.mockModule} function.
   *
   * @param {string} controller The name of the controller to load and create a context for.
   *
   * @returns {object} An object with a $scope and controller property representing the
   * controller that has been loaded and its scope.
   *
   * @example
   * var context = EasyTest.createTextContext('MyControllerName');
   * expect(context.$scope).to.have.property('MyExpectedProperty');
   * expect(context.controller.myFunc).to.be.a('function');
   */
  EasyTest.createTestContext = function createTestContext(controller) {
    var testContext = {};
    inject(function($rootScope, $controller) {
      var $scope = $rootScope.$new();
      testContext = {
        $scope: $scope,
        controller: $controller(controller, {
          $scope: $scope
        })
      };
    });
    return testContext;
  };

  /**
  * @memberof EasyTest
  * @description
  *
  * Gets a specific controller and returns a reference to it.
  *
  * @param {string} controllerName The name of the controller to get.
  *
  * @returns {object} The controller that was retreived.
  *
  * @example
  * var myController = EasyTest.getController('myController');
  */
  EasyTest.getController = function getController(controllerName) {
    return EasyTest.createTestContext(controllerName).controller;
  };

  /**
   * @memberof EasyTest
   * @description
   *
   * Compiles a directive and returns the top level element in the compiled
   * directive's HTML. Note that currently you need to mock any modules that
   * this directive may need beforehand. See the {@link EasyTest.mockModule} function.
   *
   * @param {string} directiveHTML The HTML of the directive to be compiled.
   *
   * @returns {HTMLElement} The top level HTML element of the compiled directive.
   *
   * @example
   * var element = EasyTest.compileDirective('&lt;p directive&gt;&lt;/p&gt;');
   * expect(element.length).to.equal(expectedLength);
   */
  EasyTest.compileDirective = function compileDirective(directiveHTML) {
    var $el;
    inject(function($compile, $rootScope) {
      var $scope = $rootScope.$new();
      $el = angular.element(directiveHTML);
      $compile($el)($scope);
      $scope.$digest();
    });
    return $el;
  };

  /**
   * @memberof EasyTest
   * @description
   *
   * Tests an object against a JSON specification object.
   *
   * @param {object} object The object to test.
   * @param {object} spec The 'specification' to test the object against. Should
   * have the expected types as properties and the names of the properties with
   * that type as their value, separated by spaces.
   *
   * @returns {object} An error object if anything failed, nothing if it passed.
   *
   * @example
   * // Using Chai you could pass the result directly back to 'done'
   * it('test object', function(done) {
   *   var res = EasyTest.looksLike(object, {
   *     'function': 'funcOne funcTwo',
   *     'number': 'numberOne numberTwo numberThree'
   *   });
   *   done(res);
   * });
   */
  EasyTest.looksLike = function looksLike(object, spec) {
    var types = Object.getOwnPropertyNames(spec);
    for (var i = 0; i < types.length; i++) {
      var type = types[i];
      var properties = spec[type].split(' ');
      for (var y = 0; y < properties.length; y++) {
        var property = properties[y];
        if (!(property in object)) {
          return new Error('Expected object to have the property \'' +
                           property + '\'.');
        }
        if (typeof object[property] !== type) {
          return new Error('Expected property \'' + property + '\' to be of ' +
                           'type ' + type + '.');
        }
      }
    }
  };

  /**
   * @memberof EasyTest
   * @description
   *
   * Tests a controller's scope by seeing if it conforms to a JSON specficiation
   * object. See {@link EasyTest.looksLike} for more information.
   *
   * @param {string|object} context The name of the controller to create a test
   * context for or the context itself.
   * @param {array} scopeSpec The scope's spec. An object with the names of the
   * expected types as its keys and a string for its value of all the properties,
   * separated by spaces.
   *
   * @example
   * // Will load the controller and test it using the passed spec.
   * EasyTest.testScope('MyControllerName', {
   *   'function': 'funcOne funcTwo funcThree',
   *   'number': 'numberOne numberTwo',
   *   'boolean': 'hasStuff'
   * });
   */
  EasyTest.testScope = function testScope(context, scopeSpec) {
    if (typeof context === 'string') {
      context = EasyTest.createTestContext(context);
    }
    return EasyTest.looksLike(context.$scope, scopeSpec);
  };

  /**
   * @memberof EasyTest
   * @description
   *
   * Tests a controller to see if it conforms to a JSON specification object.
   * See {@link EasyTest.looksLike} for more information.
   *
   * @param {string|object} controller The name of the controller to create or a
   * reference to a controller.
   * @param {array} spec The controller's spec. An object with the names of the
   * expected types as its keys and a string for its value of all the properties,
   * separated by spaces.
   *
   * @example
   * // Will load the controller and test it using the passed spec.
   * EasyTest.testController('MyControllerName', {
   *   'function': 'funcOne funcTwo funcThree',
   *   'number': 'numberOne numberTwo',
   *   'boolean': 'hasStuff'
   * });
   */
  EasyTest.testController = function testScope(controller, spec) {
    if (typeof controller === 'string') {
      controller = EasyTest.getController(controller);
    }
    return EasyTest.looksLike(controller, spec);
  };

  /**
  * @memberof EasyTest
  * @description
  *
  * Tests a service to see if it conforms to a JSON specification object.
  * See {@link EasyTest.looksLike} for more information.
  *
  * @param {string|object} service The name of the service to create or a
  * reference to a service.
  * @param {array} spec  The service's spec. An object with the names of the
  * expected types as its keys and a string for its value of all the properties,
  * separated by spaces.
  *
  * @example
  * // Will load the service and test it using the passed spec.
  * EasyTest.testService('MyServiceName', {
  *   'function': 'funcOne funcTwo funcThree',
  *   'number': 'numberOne numberTwo',
  *   'boolean': 'hasStuff'
  * });
  */
  EasyTest.testService = function testScope(service, spec) {
    if (typeof service === 'string') {
      service = EasyTest.getService(service);
    }
    return EasyTest.looksLike(service, spec);
  };

  window.EasyTest = EasyTest;

}());