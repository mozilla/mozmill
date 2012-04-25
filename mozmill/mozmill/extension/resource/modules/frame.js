// ***** BEGIN LICENSE BLOCK *****// ***** BEGIN LICENSE BLOCK *****
// Version: MPL 1.1/GPL 2.0/LGPL 2.1
// 
// The contents of this file are subject to the Mozilla Public License Version
// 1.1 (the "License"); you may not use this file except in compliance with
// the License. You may obtain a copy of the License at
// http://www.mozilla.org/MPL/
// 
// Software distributed under the License is distributed on an "AS IS" basis,
// WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
// for the specific language governing rights and limitations under the
// License.
// 
// The Original Code is Mozilla Corporation Code.
// 
// The Initial Developer of the Original Code is
// Mikeal Rogers.
// Portions created by the Initial Developer are Copyright (C) 2008
// the Initial Developer. All Rights Reserved.
// 
// Contributor(s):
//  Mikeal Rogers <mikeal.rogers@gmail.com>
// 
// Alternatively, the contents of this file may be used under the terms of
// either the GNU General Public License Version 2 or later (the "GPL"), or
// the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
// in which case the provisions of the GPL or the LGPL are applicable instead
// of those above. If you wish to allow use of your version of this file only
// under the terms of either the GPL or the LGPL, and not to allow others to
// use your version of this file under the terms of the MPL, indicate your
// decision by deleting the provisions above and replace them with the notice
// and other provisions required by the GPL or the LGPL. If you do not delete
// the provisions above, a recipient may use your version of this file under
// the terms of any one of the MPL, the GPL or the LGPL.
// 
// ***** END LICENSE BLOCK *****

var EXPORTED_SYMBOLS = ['loadFile','Collector','Runner','events', 
                        'jsbridge', 'runTestFile', 'log', 'getThread',
                        'timers', 'persisted'];

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

var httpd = {};   Cu.import('resource://mozmill/stdlib/httpd.js', httpd);
var os = {};      Cu.import('resource://mozmill/stdlib/os.js', os);
var strings = {}; Cu.import('resource://mozmill/stdlib/strings.js', strings);
var arrays = {};  Cu.import('resource://mozmill/stdlib/arrays.js', arrays);
var withs = {};   Cu.import('resource://mozmill/stdlib/withs.js', withs);
var utils = {};   Cu.import('resource://mozmill/stdlib/utils.js', utils);
var broker = {};  Cu.import('resource://mozmill/driver/msgbroker.js', broker);
var securableModule = {};  Cu.import('resource://mozmill/stdlib/securable-module.js', securableModule);

var aConsoleService = Cc["@mozilla.org/consoleservice;1"].getService(Ci.nsIConsoleService);
var ios = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
var subscriptLoader = Cc["@mozilla.org/moz/jssubscript-loader;1"]
                      .getService(Ci.mozIJSSubScriptLoader);
var uuidgen = Cc["@mozilla.org/uuid-generator;1"].getService(Ci.nsIUUIDGenerator);

var persisted = {};

var mozmill = undefined;
var mozelement = undefined;
var modules = undefined;

var moduleLoader = new securableModule.Loader({
  rootPaths: ["resource://mozmill/modules/"],
  defaultPrincipal: "system",
  globals : { Cc: Cc,
              Ci: Ci,
              Cu: Cu,
              Cr: Components.results}
});

var arrayRemove = function (array, from, to) {
  var rest = array.slice((to || from) + 1 || array.length);
  array.length = from < 0 ? array.length + from : from;

  return array.push.apply(array, rest);
};

var loadTestResources = function () {
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

var loadFile = function (path, collector) {
  // load a test module from a file and add some candy
  var file = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
  file.initWithPath(path);
  var uri = ios.newFileURI(file).spec;

  loadTestResources();
  var assertions = moduleLoader.require("assertions");

  var module = {
    assert: new assertions.Assert(),
    Cc: Cc,
    Ci: Ci,
    Cr: Components.results,
    Cu: Cu,
    collector: collector,
    driver: moduleLoader.require("driver"),
    elementslib: mozelement,
    expect: new assertions.Expect(),
    findElement: mozelement,
    log: log,
    mozmill: mozmill,
    persisted: persisted
  }

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

function stateChangeBase (possibilties, restrictions, target, cmeta, v) {
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

timers = [];

var events = {
  'currentState' : null,
  'currentModule': null,
  'currentTest'  : null,
  'userShutdown' : false,
  'appQuit'      : false,
  'listeners'    : {}
};

events.globalListeners = [];

events.setState = function (v) {
  return stateChangeBase(['dependencies', 'setupModule', 'teardownModule',
                          'test', 'collection'],
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

events.startUserShutdown = function (obj) {
  events.toggleUserShutdown(obj);
  events.fireEvent('userShutdown', obj);
}

events.setTest = function (test, invokedFromIDE) {
  test.__passes__ = [];
  test.__fails__ = [];
  test.__invokedFromIDE__ = invokedFromIDE;
  events.currentTest = test;
  test.__start__ = Date.now();

  var obj = {'filename': events.currentModule.__file__,
             'name': test.__name__}
  events.fireEvent('setTest', obj);
}

events.endTest = function (test) {
  // use the current test unless specified
  if (test === undefined) {
    test = events.currentTest;
  }  

  // report the end of a test
  test.status = 'done';
  events.currentTest = null; 
  test.__end__ = Date.now();

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
  if (test.__passes__ &&
      (test.__name__ == 'setupModule' || test.__name__ == 'teardownModule')) {
    shouldSkipReporting = true;
  }

  if (!shouldSkipReporting) {
    events.fireEvent('endTest', obj);
  }
}

events.setModule = function (v) {
  return stateChangeBase( null, [function (v) {return (v.__file__ != undefined)}], 
                          'currentModule', 'setModule', v);
}

events.pass = function (obj) {
  // a low level event, such as a keystroke, succeeds
  if (events.currentTest) {
    events.currentTest.__passes__.push(obj);
  }

  for each(var timer in timers) {
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

  for each(var time in timers) {
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
        this.listeners[listenerIndex] = arrayRemove(e, i);
      }
    }
  }

  for (var i in this.globalListeners) {
    if (this.globalListeners[i] == listener) {
      this.globalListeners = arrayRemove(this.globalListeners, i);
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

events.screenShot = function (obj) {
  // Find the name of the test function
  for (var attr in events.currentModule) {
    if (events.currentModule[attr] == events.currentTest) {
      var testName = attr;
      break;
    }
  }

  obj['test_file'] = events.currentModule.__file__;
  obj['test_name'] = testName;
  events.fireEvent('screenShot', obj);
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
                  'screenShot': events.screenShot});

try {
  var jsbridge = {}; Cu.import('resource://jsbridge/modules/events.js', jsbridge);
} catch (e) {
  var jsbridge = null;

  aConsoleService.logStringMessage("jsbridge not available.");
}

if (jsbridge) {
  events.addListener('', function (name, obj) {
                           jsbridge.fireEvent('mozmill.' + name, obj)
                         });
}

function Collector () {
  // the collector handles HTTPD and initilizing the module
  this.test_modules_by_filename = {};
  this.testing = [];
  this.httpd_started = false;
  this.http_port = 43336;
  this.http_server = httpd.getServer(this.http_port);
}

Collector.prototype.startHttpd = function () {
  while (this.httpd == undefined) {
    try {
      this.http_server.start(this.http_port);
      this.httpd = this.http_server;
    } catch (e) { // Failure most likely due to port conflict
      this.http_port++;
      this.http_server = httpd.getServer(this.http_port);
    }; 
  }
}

Collector.prototype.stopHttpd = function () {
  if (this.httpd) {
    // Callback needed to pause execution until the server has been properly shutdown
    this.httpd.stop(function () { });
    this.httpd = null;
  }
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

Collector.prototype.initTestModule = function (filename, name) {
  var test_module = loadFile(filename, this);
  test_module.__tests__ = [];

  for (var i in test_module) {
    if (typeof(test_module[i]) == "function") {
      test_module[i].__name__ = i;
      if (i == "setupModule") {
        test_module.__setupModule__ = test_module[i];
      } else if (i == "teardownModule") {
        test_module.__teardownModule__ = test_module[i];
      } else if (withs.startsWith(i, "test")) {
        if (name && (i != name)) {
          continue;
        }

        name = null;
        test_module.__tests__.push(test_module[i]);
      }
    }
  }

  test_module.collector = this;
  test_module.status = 'loaded';
  this.test_modules_by_filename[filename] = test_module;

  return test_module;
}

// Observer which gets notified when the application quits
function AppQuitObserver() {
  this.register();
}

AppQuitObserver.prototype = {
  observe: function (subject, topic, data) {
    events.appQuit = true;
  },

  register: function () {
    var obsService = Cc["@mozilla.org/observer-service;1"]
                     .getService(Ci.nsIObserverService);
    obsService.addObserver(this, "quit-application", false);
  },

  unregister: function () {
    var obsService = Cc["@mozilla.org/observer-service;1"]
                     .getService(Ci.nsIObserverService);
    obsService.removeObserver(this, "quit-application");
  }
}


function Runner(collector, invokedFromIDE) {
  this.collector = collector;
  this.invokedFromIDE = invokedFromIDE
  events.fireEvent('startRunner', true);
  var m = {}; Cu.import('resource://mozmill/driver/mozmill.js', m);
  this.platform = m.platform;
}

Runner.prototype.runTestFile = function (filename, name) {
  this.collector.initTestModule(filename, name);
  this.runTestModule(this.collector.test_modules_by_filename[filename]);
}

Runner.prototype.end = function () {
  events.persist();
  this.collector.stopHttpd();
  events.fireEvent('endRunner', true);
}

Runner.prototype.wrapper = function (func, arg) {
  thread = Cc["@mozilla.org/thread-manager;1"]
           .getService(Ci.nsIThreadManager).currentThread;

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

    // If a user shutdown was expected but the application hasn't quit, throw a failure
    if (events.isUserShutdown()) {
      // Prevents race condition between mozrunner hard process kill and normal FFx shutdown
      utils.sleep(500);

      if (events.userShutdown['user'] && !events.appQuit) {
          events.fail({'function':'Runner.wrapper',
                       'message':'Shutdown expected but none detected before end of test',
                       'userShutdown': events.userShutdown});
      }
    }
  } catch (e) {
    // Allow the exception if a user shutdown was expected
    if (!events.isUserShutdown()) {
      events.fail({'exception': e, 'test': func})
      Cu.reportError(e);
    }
  }
}

Runner.prototype.runTestModule = function (module) {
  events.setModule(module);
  module.__status__ = 'running';

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
    var observer = new AppQuitObserver();
    for (var i in module.__tests__) {
      events.appQuit = false;
      var test = module.__tests__[i];

      // TODO: introduce per-test timeout:
      // https://bugzilla.mozilla.org/show_bug.cgi?id=574871

      events.setState('test'); 
      events.setTest(test, this.invokedFromIDE);

      this.wrapper(test);
      if (events.userShutdown && !events.userShutdown['user']) {
          events.endTest(test);
          break;
      }
      events.endTest(test)
    }

    observer.unregister();
  } else {
    for each(var test in module.__tests__) {
      events.setTest(test);
      events.skip("setupModule failed.");
      events.endTest(test);
    }
  }

  if (module.__teardownModule__) {
    events.setState('teardownModule');
    events.setTest(module.__teardownModule__);
    this.wrapper(module.__teardownModule__, module);
    events.endTest(module.__teardownModule__);
  }

  module.__status__ = 'done';
}

var runTestFile = function (filename, invokedFromIDE, name) {
  var runner = new Runner(new Collector(), invokedFromIDE);
  runner.runTestFile(filename, name);
  runner.end();

  return true;
}

var getThread = function () {
  return thread;
}
