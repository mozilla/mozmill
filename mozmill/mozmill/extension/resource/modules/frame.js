/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

var EXPORTED_SYMBOLS = ['Collector', 'Runner', 'events', 'runTestFile', 'log',
                        'timers', 'persisted'];

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

const TIMEOUT_SHUTDOWN_HTTPD = 15000;

Cu.import("resource://gre/modules/Services.jsm");

Cu.import('resource://mozmill/stdlib/httpd.js');

var broker = {};  Cu.import('resource://mozmill/driver/msgbroker.js', broker);
var assertions = {}; Cu.import('resource://mozmill/modules/assertions.js', assertions);
var errors = {}; Cu.import('resource://mozmill/modules/errors.js', errors);
var os = {};      Cu.import('resource://mozmill/stdlib/os.js', os);
var strings = {}; Cu.import('resource://mozmill/stdlib/strings.js', strings);
var arrays = {};  Cu.import('resource://mozmill/stdlib/arrays.js', arrays);
var withs = {};   Cu.import('resource://mozmill/stdlib/withs.js', withs);
var utils = {};   Cu.import('resource://mozmill/stdlib/utils.js', utils);

var securableModule = {};
Cu.import('resource://mozmill/stdlib/securable-module.js', securableModule);

var aConsoleService = Cc["@mozilla.org/consoleservice;1"].getService(Ci.nsIConsoleService);
var ios = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
var subscriptLoader = Cc["@mozilla.org/moz/jssubscript-loader;1"]
                      .getService(Ci.mozIJSSubScriptLoader);
var uuidgen = Cc["@mozilla.org/uuid-generator;1"].getService(Ci.nsIUUIDGenerator);

var persisted = {};

var mozmill = undefined;
var mozelement = undefined;
var modules = undefined;

var timers = [];


function stateChangeBase(possibilties, restrictions, target, cmeta, v) {
  if (possibilties) {
    if (!arrays.inArray(possibilties, v)) {
      // TODO Error value not in this.poss
      return;
    }
  }

  if (restrictions) {
    for (var i in restrictions) {
      var r = restrictions[i];
      if (!r(v)) {
        // TODO error value did not pass restriction
        return;
      }
    }
  }

  // Fire jsbridge notification, logging notification, listener notifications
  events[target] = v;
  events.fireEvent(cmeta, target);
}


var events = {
  appQuit         : false,
  currentModule   : null,
  currentState    : null,
  currentTest     : null,
  userShutdown    : false,

  listeners       : {},
  globalListeners : []
}

events.setState = function (v) {
  return stateChangeBase(['dependencies', 'setupModule', 'teardownModule',
                          'test', 'setupTest', 'teardownTest', 'collection'],
                          null, 'currentState', 'setState', v);
}

events.toggleUserShutdown = function (obj){
  if (this.userShutdown) {
    this.fail({'function':'frame.events.toggleUserShutdown',
               'message':'Shutdown expected but none detected before timeout',
               'userShutdown': obj});
  }

  this.userShutdown = obj;
}

events.isUserShutdown = function () {
  return Boolean(this.userShutdown);
}

events.isRestartShutdown = function () {
  return this.userShutdown.restart;
}

events.startUserShutdown = function (obj) {
  events.toggleUserShutdown(obj);
  events.fireEvent('userShutdown', obj);
}

events.setTest = function (test) {
  test.__start__ = Date.now();
  test.__passes__ = [];
  test.__fails__ = [];

  events.currentTest = test;

  var obj = {'filename': events.currentModule.__file__,
             'name': test.__name__}
  events.fireEvent('setTest', obj);
}

events.endTest = function (test) {
  // use the current test unless specified
  if (test === undefined) {
    test = events.currentTest;
  }

  // If no test is set it has already been reported.
  // We don't want to do it a second time.
  if (!test)
    return;

  // report the end of a test
  test.__end__ = Date.now();
  test.status = 'done';
  events.currentTest = null;

  var obj = {'filename': events.currentModule.__file__,
             'passed': test.__passes__.length,
             'failed': test.__fails__.length,
             'passes': test.__passes__,
             'fails' : test.__fails__,
             'name'  : test.__name__,
             'time_start': test.__start__,
             'time_end': test.__end__}

  if (test.skipped) {
    obj['skipped'] = true;
    obj.skipped_reason = test.skipped_reason;
  }

  if (test.meta) {
    obj.meta = test.meta;
  }

  // Report the test result only if the test is a true test or if it is a
  // failing setup/teardown
  var shouldSkipReporting = false;
  var modulelist = ['setupModule', 'teardownModule', 'setupTest', 'teardownTest'];

  if (test.__passes__ &&
      (modulelist.indexOf(test.__name__) != -1)) {
    shouldSkipReporting = true;
  }

  if (!shouldSkipReporting) {
    events.fireEvent('endTest', obj);
  }
}

events.setModule = function (aModule) {
  aModule.__start__ = Date.now();

  var result = stateChangeBase(null,
                               [function (aModule) {return (aModule.__file__ != undefined)}],
                               'currentModule', 'setModule', aModule);
  aModule.__status__ = 'running';

  return result;
}

events.endModule = function (aModule) {
  aModule.__end__ = Date.now();
  aModule.__status__ = 'done';

  var obj = {
    'filename': aModule.__file__,
    'time_start': aModule.__start__,
    'time_end': aModule.__end__
  }

  events.fireEvent('endModule', obj);
}

events.pass = function (obj) {
  // a low level event, such as a keystroke, succeeds
  if (events.currentTest) {
    events.currentTest.__passes__.push(obj);
  }

  for each (var timer in timers) {
    timer.actions.push(
      {"currentTest": events.currentModule.__file__ + "::" + events.currentTest.__name__,
       "obj": obj,
       "result": "pass"}
    );
  }

  events.fireEvent('pass', obj);
}

events.fail = function (obj) {
  var error = obj.exception;

  if (error) {
    // Error objects aren't enumerable https://bugzilla.mozilla.org/show_bug.cgi?id=637207
    obj.exception = {
      name: error.name,
      message: error.message,
      lineNumber: error.lineNumber,
      fileName: error.fileName,
      stack: error.stack
    };
  }

  // a low level event, such as a keystroke, fails
  if (events.currentTest) {
    events.currentTest.__fails__.push(obj);
  }

  for each (var time in timers) {
    timer.actions.push(
      {"currentTest": events.currentModule.__file__ + "::" + events.currentTest.__name__,
       "obj": obj,
       "result": "fail"}
    );
  }

  events.fireEvent('fail', obj);
}

events.skip = function (reason) {
  // this is used to report skips associated with setupModule and nothing else
  events.currentTest.skipped = true;
  events.currentTest.skipped_reason = reason;

  for each(var timer in timers) {
    timer.actions.push(
      {"currentTest":events.currentModule.__file__ + "::" + events.currentTest.__name__,
       "obj": reason,
       "result": "skip"}
    );
  }

  events.fireEvent('skip', reason);
}

events.fireEvent = function (name, obj) {
  if (this.listeners[name]) {
    for (var i in this.listeners[name]) {
      this.listeners[name][i](obj);
    }
  }

  for each(var listener in this.globalListeners) {
    listener(name, obj);
  }
}

events.addListener = function (name, listener) {
  if (this.listeners[name]) {
    this.listeners[name].push(listener);
  } else if (name == '') {
    this.globalListeners.push(listener)
  } else {
    this.listeners[name] = [listener];
  }
}

events.removeListener = function (listener) {
  for (var listenerIndex in this.listeners) {
    var e = this.listeners[listenerIndex];

    for (var i in e){
      if (e[i] == listener) {
        this.listeners[listenerIndex] = arrays.remove(e, i);
      }
    }
  }

  for (var i in this.globalListeners) {
    if (this.globalListeners[i] == listener) {
      this.globalListeners = arrays.remove(this.globalListeners, i);
    }
  }
}

events.persist = function () {
  try {
    events.fireEvent('persist', persisted);
  } catch (e) {
    events.fireEvent('error', "persist serialization failed.")
  }
}

events.firePythonCallback = function (obj) {
  obj['test'] = events.currentModule.__file__;
  events.fireEvent('firePythonCallback', obj);
}

events.screenshot = function (obj) {
  // Find the name of the test function
  for (var attr in events.currentModule) {
    if (events.currentModule[attr] == events.currentTest) {
      var testName = attr;
      break;
    }
  }

  obj['test_file'] = events.currentModule.__file__;
  obj['test_name'] = testName;
  events.fireEvent('screenshot', obj);
}

var log = function (obj) {
  events.fireEvent('log', obj);
}

// Register the listeners
broker.addObject({'pass': events.pass,
                  'fail': events.fail,
                  'log': log,
                  'persist': events.persist,
                  'endTest': events.endTest,
                  'userShutdown': events.startUserShutdown,
                  'firePythonCallback': events.firePythonCallback,
                  'screenshot': events.screenshot});

try {
  Cu.import('resource://jsbridge/modules/Events.jsm');

  events.addListener('', function (name, obj) {
    Events.fireEvent('mozmill.' + name, obj);
  });
} catch (e) {
  aConsoleService.logStringMessage("Event module of JSBridge not available.");
}


/**
 * Observer for notifications when the application is going to shutdown
 */
function AppQuitObserver(aRunner) {
  this._runner = aRunner;
  this.register();
}

AppQuitObserver.prototype = {
  observe: function (aSubject, aTopic, aData) {
    switch (aTopic) {
      case "quit-application":
        Services.obs.removeObserver(this, "quit-application");

        // If we observe a quit notification make sure to send the
        // results of the current test. In those cases we don't reach
        // the equivalent code in runTestModule()
        events.pass({'message': 'AppQuitObserver: ' + aData,
                     'userShutdown': events.userShutdown});
        events.endTest();

        events.appQuit = true;
        this._runner.end();

        break;
    }
  },

  register: function () {
    Services.obs.addObserver(this, "quit-application", false);
  },

  unregister: function () {
    Services.obs.removeObserver(this, "quit-application");
  }
}


/**
 * The collector handles HTTPd.js and initilizing the module
 */
function Collector() {
  this.test_modules_by_filename = {};
  this.testing = [];

  this.httpd_started = false;
  this.http_port = 43336;
  this.httpd = null;
}

Collector.prototype.getServer = function (port, basePath) {
  if (basePath) {
    var lp = Cc["@mozilla.org/file/local;1"]
      .createInstance(Ci.nsILocalFile);
    lp.initWithPath(basePath);
  }

  var srv = new HttpServer();
  if (lp) {
    srv.registerDirectory("/", lp);
  }

  srv.registerContentType("sjs", "sjs");
  srv.identity.setPrimary("http", "localhost", port);

  return srv;
}

Collector.prototype.startHttpd = function () {
  while (!this.httpd) {
    try {
      var http_server = this.getServer(this.http_port);
      http_server.start(this.http_port);
      this.httpd = http_server;
    } catch (e) { // Failure most likely due to port conflict
      this.http_port++;
    }
  }
}

Collector.prototype.stopHttpd = function () {
  if (!this.httpd) {
    return;
  }

  var shutdown = false;
  this.httpd.stop(function () { shutdown = true; });

  utils.waitFor(function () {
    return shutdown;
  }, "Local HTTP server has been stopped", TIMEOUT_SHUTDOWN_HTTPD);

  this.httpd = null;
}

Collector.prototype.addHttpResource = function (directory, ns) {
  if (!this.httpd) {
    this.startHttpd();
  }

  if (!ns) {
    ns = '/';
  } else {
    ns = '/' + ns + '/';
  }

  var lp = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
  lp.initWithPath(os.abspath(directory, this.current_file));
  this.httpd.registerDirectory(ns, lp);

  return 'http://localhost:' + this.http_port + ns
}

Collector.prototype.initTestModule = function (filename, testname) {
  var test_module = this.loadFile(filename, this);
  var has_restarted = !(testname == null);
  test_module.__tests__ = [];

  for (var i in test_module) {
    if (typeof(test_module[i]) == "function") {
      test_module[i].__name__ = i;

      // Only run setupModule if we are a single test OR if we are the first
      // test of a restart chain (don't run it prior to members in a restart
      // chain)
      if (i == "setupModule" && !has_restarted) {
        test_module.__setupModule__ = test_module[i];
      } else if (i == "setupTest") {
        test_module.__setupTest__ = test_module[i];
      } else if (i == "teardownTest") {
        test_module.__teardownTest__ = test_module[i];
      } else if (i == "teardownModule") {
        test_module.__teardownModule__ = test_module[i];
      } else if (withs.startsWith(i, "test")) {
        if (testname && (i != testname)) {
          continue;
        }

        testname = null;
        test_module.__tests__.push(test_module[i]);
      }
    }
  }

  test_module.collector = this;
  test_module.status = 'loaded';

  this.test_modules_by_filename[filename] = test_module;

  return test_module;
}

Collector.prototype.loadFile = function (path, collector) {
  var moduleLoader = new securableModule.Loader({
    rootPaths: ["resource://mozmill/modules/"],
    defaultPrincipal: "system",
    globals : { Cc: Cc,
                Ci: Ci,
                Cu: Cu,
                Cr: Components.results}
  });

  // load a test module from a file and add some candy
  var file = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
  file.initWithPath(path);
  var uri = ios.newFileURI(file).spec;

  this.loadTestResources();

  var systemPrincipal = Services.scriptSecurityManager.getSystemPrincipal();
  var module = new Components.utils.Sandbox(systemPrincipal);
  module.assert = new assertions.Assert();
  module.Cc = Cc;
  module.Ci = Ci;
  module.Cr = Components.results;
  module.Cu = Cu;
  module.collector = collector;
  module.driver = moduleLoader.require("driver");
  module.elementslib = mozelement;
  module.errors = errors;
  module.expect = new assertions.Expect();
  module.findElement = mozelement;
  module.log = log;
  module.mozmill = mozmill;
  module.persisted = persisted;

  module.require = function (mod) {
    var loader = new securableModule.Loader({
      rootPaths: [ios.newFileURI(file.parent).spec,
                  "resource://mozmill/modules/"],
      defaultPrincipal: "system",
      globals : { mozmill: mozmill,
                  elementslib: mozelement,      // This a quick hack to maintain backwards compatibility with 1.5.x
                  findElement: mozelement,
                  persisted: persisted,
                  Cc: Cc,
                  Ci: Ci,
                  Cu: Cu,
                  log: log }
    });

    if (modules != undefined) {
      loader.modules = modules;
    }

    var retval = loader.require(mod);
    modules = loader.modules;

    return retval;
  }

  if (collector != undefined) {
    collector.current_file = file;
    collector.current_path = path;
  }

  try {
    subscriptLoader.loadSubScript(uri, module, "UTF-8");
  } catch (e) {
    var obj = {
      'filename': path,
      'passed': 0,
      'failed': 1,
      'passes': [],
      'fails' : [{'exception' : {
                    message: e.message,
                    filename: e.filename,
                    lineNumber: e.lineNumber}}],
      'name'  :'<TOP_LEVEL>'
    };

    events.fail({'exception': e});
    events.fireEvent('endTest', obj);
  }

  module.__file__ = path;
  module.__uri__ = uri;

  return module;
}

Collector.prototype.loadTestResources = function () {
  // load resources we want in our tests
  if (mozmill == undefined) {
    mozmill = {};
    Cu.import("resource://mozmill/driver/mozmill.js", mozmill);
  }
  if (mozelement == undefined) {
    mozelement = {};
    Cu.import("resource://mozmill/driver/mozelement.js", mozelement);
  }
}


function Runner() {
  this.collector = new Collector();

  var m = {}; Cu.import('resource://mozmill/driver/mozmill.js', m);
  this.platform = m.platform;

  events.fireEvent('startRunner', true);
}

Runner.prototype.end = function () {
  events.persist();
  this.collector.stopHttpd();

  events.fireEvent('endRunner', true);
};

Runner.prototype.runTestFile = function (filename, name) {
  var module = this.collector.initTestModule(filename, name);
  this.runTestModule(module);
};

Runner.prototype.runTestModule = function (module) {
  events.setModule(module);

  var observer = new AppQuitObserver(this);

  if (module.__setupModule__) {
    events.setState('setupModule');
    events.setTest(module.__setupModule__);
    this.wrapper(module.__setupModule__, module);
    var setupModulePassed = (events.currentTest.__fails__.length == 0 &&
                             !events.currentTest.skipped);
    events.endTest(module.__setupModule__);
  } else {
    var setupModulePassed = true;
  }

  if (setupModulePassed) {
    if (module.__setupTest__) {
      events.setState('setupTest');
      events.setTest(module.__setupTest__);
      this.wrapper(module.__setupTest__, module);
      var setupTestPassed = (events.currentTest.__fails__.length == 0 &&
                             !events.currentTest.skipped);
      events.endTest(module.__setupTest__);
    } else {
      var setupTestPassed = true;
    }

    if (setupTestPassed) {
      for (var i in module.__tests__) {
        events.appQuit = false;
        var test = module.__tests__[i];

        events.setState('test');
        events.setTest(test);
        this.wrapper(test);
        if (events.userShutdown) {
          break;
        }
        events.endTest(test)
      }
    } else {
      for each(var test in module.__tests__) {
        events.setTest(test);
        events.skip("setupTest failed.");
        events.endTest(test);
      }
    }

    if (module.__teardownTest__) {
      events.setState('teardownTest');
      events.setTest(module.__teardownTest__);
      this.wrapper(module.__teardownTest__, module);
      events.endTest(module.__teardownTest__);
    }
  } else {
    for each(var test in module.__tests__) {
      events.setTest(test);
      events.skip("setupModule failed.");
      events.endTest(test);
    }
  }

  // We only call teardownModule if we are not about to do a restart of
  // the application - i.e. call it in a single test or the last test of
  // a restart chain.
  if (module.__teardownModule__ && (events.userShutdown == false)) {
    events.setState('teardownModule');
    events.setTest(module.__teardownModule__);
    this.wrapper(module.__teardownModule__, module);
    events.endTest(module.__teardownModule__);
  }

  observer.unregister();

  events.endModule(module);
};

Runner.prototype.wrapper = function (func, arg) {
  // skip excluded platforms
  if (func.EXCLUDED_PLATFORMS != undefined) {
    if (arrays.inArray(func.EXCLUDED_PLATFORMS, this.platform)) {
      events.skip("Platform exclusion");
      return;
    }
  }

  // skip function if requested
  if (func.__force_skip__ != undefined) {
    events.skip(func.__force_skip__);
    return;
  }

  // execute the test function
  try {
    if (arg) {
      func(arg);
    } else {
      func();
    }

    // If a user shutdown was expected but the application hasn't quit yet,
    // throw a failure and mark the test as failed.
    if (events.isUserShutdown()) {
      // Prevents race condition between mozrunner hard process kill
      // and normal FFx shutdown
      utils.sleep(500);

      if (events.userShutdown['user'] && !events.appQuit) {
        events.fail({'function': 'Runner.wrapper',
                     'message':'Shutdown expected but none detected before end of test',
                     'userShutdown': events.userShutdown});
        events.endTest();

        // Depending on the shutdown mode quit or restart the application
        let flags = Ci.nsIAppStartup.eAttemptQuit;
        if (events.isRestartShutdown()) {
          flags |= Ci.nsIAppStartup.eRestart;
        }

        let appStartup = Cc["@mozilla.org/toolkit/app-startup;1"]
                         .getService(Ci.nsIAppStartup);
        appStartup.quit(flags);
      }
    }
  } catch (e) {
    // Allow the exception if it's not an user shutdown
    if (!events.isUserShutdown()) {
      events.fail({'exception': e, 'test': func})
    }
  }
};

function runTestFile(filename, name) {
  var runner = new Runner();
  runner.runTestFile(filename, name);
  runner.end();

  return true;
}
