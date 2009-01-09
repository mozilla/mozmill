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

var EXPORTED_SYMBOLS = ['loadFile','register_function','Collector','Runner','events', 
                        'jsbridge', 'runTestDirectory', 'runTestFile', 'log'];

var httpd = {};   Components.utils.import('resource://mozmill/stdlib/httpd.js', httpd);
var os = {};      Components.utils.import('resource://mozmill/stdlib/os.js', os);
var strings = {}; Components.utils.import('resource://mozmill/stdlib/strings.js', strings);
var arrays = {};  Components.utils.import('resource://mozmill/stdlib/arrays.js', arrays);
var withs = {};   Components.utils.import('resource://mozmill/stdlib/withs.js', withs);

var ios = Components.classes["@mozilla.org/network/io-service;1"]
                    .getService(Components.interfaces.nsIIOService);
var loader = Components.classes["@mozilla.org/moz/jssubscript-loader;1"]
                    .getService(Components.interfaces.mozIJSSubScriptLoader);
var uuidgen = Components.classes["@mozilla.org/uuid-generator;1"]
                    .getService(Components.interfaces.nsIUUIDGenerator);  

var backstage = this;

var registeredFunctions = {};

var loadFile = function(path, collector) {
  var file = Components.classes["@mozilla.org/file/local;1"]
                       .createInstance(Components.interfaces.nsILocalFile);
  file.initWithPath(path);
  var uri = ios.newFileURI(file).spec;

  var module = {};  
  module.registeredFunctions = registeredFunctions;
  module.collector = collector
  if (collector != undefined) {
    collector.current_file = file;
    collector.current_path = path;
  }
  try {
    loader.loadSubScript(uri, module);
  } catch(e) {
    Components.utils.reportError(e);
  }
  
  module.__file__ = path;
  module.__uri__ = uri;
  return module;
}

function registerFunction (name, func) {
  registeredFunctions[name] = func;
}

function stateChangeBase (possibilties, restrictions, target, cmeta, v) {
  if (possibilties) {
    if (!arrays.inArray(possibilties, v)) {
      // TODO Error value not in this.poss
      return;
    } 
  }
  if (restrictions) {
    for (i in restrictions) {
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
  'currentState' : null,
  'currentModule': null,
  'currentTest'  : null,
  'listeners'    : {},
}
events.setState = function (v) {
   return stateChangeBase(['dependencies', 'setupModule', 'teardownModule', 
                           'setupTest', 'teardownTest', 'test', 'collection'], 
                           null, 'currentState', 'setState', v);
}
events.setTest = function (test) {
  test.__passes__ = [];
  test.__fails__ = [];
  events.currentTest = test;
  var obj = {'filename':events.currentModule.__file__,
             'name':test.__name__,
            }
  events.fireEvent('setTest', obj);
}
events.endTest = function (test) {
  test.status = 'done';
  events.currentTest = null;
  var obj = {'filename':events.currentModule.__file__, 
         'passed':test.__passes__.length,
         'failed':test.__fails__.length,
         'passes':test.__passes__,
         'fails' :test.__fails__,
         'name'  :test.__name__,
         }
  events.fireEvent('endTest', obj);
}
events.setModule = function (v) {
  return stateChangeBase( null, [function (v) {return (v.__file__ != undefined)}], 
                          'currentModule', 'setModule', v);
}
events.pass = function (obj) {
  events.currentTest.__passes__.push(obj);
  events.fireEvent('pass', obj);
}
events.fail = function (obj) {
  events.currentTest.__fails__.push(obj);
  events.fireEvent('fail', obj);
}
events.fireEvent = function (name, obj) {
  if (this.listeners[name]) {
    for (i in this.listeners[name]) {
      this.listeners[name][i](obj);
    }
  }
  for each(listener in this.globalListeners) {
    listener(name, obj);
  }
}
events.globalListeners = [];
events.addListener = function (name, listener) {
  if (this.listeners[name]) {
    this.listeners[name].push(listener);
  } else if (name =='') {
    this.globalListeners.push(listener)
  } else {
    this.listeners[name] = [listener];
  }
}

var log = function (obj) {
  events.fireEvent('log', obj);
}

try {
  var jsbridge = {}; Components.utils.import('resource://jsbridge/modules/events.js', jsbridge);
} catch(err) {
  var jsbridge = null;
  var aConsoleService = Components.classes["@mozilla.org/consoleservice;1"].
       getService(Components.interfaces.nsIConsoleService);

  aConsoleService.logStringMessage("jsbridge not available.");
}

if (jsbridge) {
  events.addListener('', function (name, obj) {jsbridge.fireEvent('mozmill.'+name, obj)} );
}

var http_server = httpd.getServer(43336);

function Collector () {
  this.test_modules_by_filename = {};
  this.test_modules_by_name = {};
  this.requirements_run = {};
  this.all_requirements = [];
  this.loaded_directories = [];
  this.testing = [];
  this.httpd_started = false;
  this.starting_http_port = 43336;
  var logging = {}; Components.utils.import('resource://mozmill/stdlib/logging.js', logging);
  this.logger = new logging.Logger('Collector');
}
Collector.prototype.getModule = function (name) {
  return this.test_modules_by_name[name];
}
Collector.prototype.startHttpd = function () {
  if (http_server._socket == null) {
    http_server.start();
  }
  this.httpd = http_server;
}
Collector.prototype.stopHttpd = function () {
  this.httpd.stop()
  this.httpd = null;
}
Collector.prototype.addHttpResource = function (directory, ns) {
  if (!this.httpd) {
    this.startHttpd();
  }
  if (ns == undefined) {
    var ns = uuidgen.generateUUID().toString().replace('-', '').replace('{', '').replace('}','');
  }
  var lp = Components.classes["@mozilla.org/file/local;1"]
             .createInstance(Components.interfaces.nsILocalFile);
  lp.initWithPath(os.abspath(directory, this.current_file));
  this.httpd.registerDirectory('/'+ns+'/', lp);
  return 'http://localhost:'+this.httpd._port+'/'+ns+'/'
}
Collector.prototype.initTestModule = function (filename) {
  var test_module = loadFile(filename, this);
  test_module.__tests__ = [];
  for (i in test_module) {
    if (typeof(test_module[i]) == "function") {
      if (i == "setupTest") {
        test_module[i].__name__ = i;
        test_module.__setupTest__ = test_module[i];
      } else if (i == "setupModule") {
        test_module[i].__name__ = i;
        test_module.__setupModule__ = test_module[i];
      } else if (i == "teardownTest") {
        test_module[i].__name__ = i;
        test_module.__teardownTest__ = test_module[i];
      } else if (i == "teardownModule") {
        test_module[i].__name__ = i;
        test_module.__teardownModule__ = test_module[i];
      } else if (withs.startsWith(i, "test")) {
        test_module[i].__name__ = i;
        test_module.__tests__.push(test_module[i]);
      }
    }
    if (i == "RELATIVE_ROOT") {
      test_module.__root_path__ = os.abspath(test_module[i], os.getFileForPath(filename));
    }
    if (i == "MODULE_REQUIRES") {
      test_module.__requirements__ = test_module[i];
      this.all_requirements.push.apply(backstage, test_module[i]);
    }
    if (i == "MODULE_NAME") {
      test_module.__module_name__ = test_module[i];
      this.test_modules_by_name[test_module[i]] = test_module;
    }
  }
  test_module.collector = this;
  test_module.status = 'loaded';
  this.test_modules_by_filename[filename] = test_module;
  return test_module;
}
Collector.prototype.initTestDirectory = function (directory) {
  var r = this;
  function recursiveModuleLoader(dfile) {
    r.loaded_directories.push(directory);
    var dfiles = os.listDirectory(dfile);
    for (i in dfiles) {
      var f = dfiles[i];
      if ( f.isDirectory() && 
           !withs.startsWith(f.leafName, '.') && 
           !arrays.inArray(r.loaded_directories, f.path) ) {
        recursiveModuleLoader(os.getFileForPath(f.path));
      } else if ( withs.startsWith(f.leafName, "test") && 
                  withs.endsWith(f.leafName, ".js")    &&
                  !arrays.inArray(r.test_modules_by_filename, f.path) ) {
        r.initTestModule(f.path);
      }
      r.testing.push(f.path);
    }
  }
  recursiveModuleLoader(os.getFileForPath(directory));
}

function Runner (collector) {
  this.collector = collector;
  events.fireEvent('startRunner', true);
  var logging = {}; Components.utils.import('resource://mozmill/stdlib/logging.js', logging);
  this.logger = new logging.Logger('Runner');
}
Runner.prototype.runTestDirectory = function (directory) {
  this.collector.initTestDirectory(directory);
  
  for (i in this.collector.test_modules_by_filename) {
    var test = this.collector.test_modules_by_filename[i];
    if (test.status != 'done') {
      this.runTestModule(test);
    }
  }
}
Runner.prototype.runTestFile = function (filename) {
  // if ( !arrays.inArray(this.test_modules_by_filename, directory) ) {
  //   this.collector.initTestModule(directory);
  // }
  this.collector.initTestModule(filename);
  this.runTestModule(this.collector.test_modules_by_filename[filename]);
}
Runner.prototype.end = function () {
  events.fireEvent('endRunner', true);
}
Runner.prototype.getDependencies = function (module) {
  events.setState('dependencies');
  var alldeps = [];
  function recursiveGetDeps (mod) {
    for (i in mod.__dependencies__) {
      var m = mod.dependencies[i];
      if ( !arrays.inArray(this.test_modules_by_name, m) ) {
        // TODO: Raise Error that this dependency cannot be resolved.
      } else {
        recursiveGetDeps(this.test_modules_by_name[m]);
        alldeps.push(m);
      }
    }
  }
  return alldeps;
}
Runner.prototype.wrapper = function (func, arg) {
  try {
    if (arg) {
      func(arg);
    } else {
      func();
    }
  } catch (e) {
    events.fail({'exception':e, 'test':func})
    Components.utils.reportError(e);
  }
}

Runner.prototype._runTestModule = function (module) {
  var attrs = [];
  for (i in module) {
    attrs.push(i);
  }
  events.setModule(module);
  module.__status__ = 'running';
  if (module.__setupModule__) { 
    events.setState('setupModule');
    events.setTest(module.__setupModule__);
    this.wrapper(module.__setupModule__, module); 
    events.endTest(module.__setupModule__);
    }
  for (i in module.__tests__) {
    var test = module.__tests__[i];
    test.registeredFunctions = registeredFunctions;
    if (module.__setupTest__) { 
      events.setState('setupTest');
      events.setTest(module.__setupTest__);
      this.wrapper(module.__setupTest__, test); 
      events.endTest(module.__setupTest__);
      }  
    events.setState('test'); 
    events.setTest(test);
    this.wrapper(test);
    if (module.__teardownTest___) {
      events.setState('teardownTest'); 
      events.setTest(module.__teardownTest__);
      this.wrapper(module.__teardownTest__, test); 
      events.endTest(module.__teardownTest__);
      }
    events.endTest(test)
  }
  if (module.__teardownModule__) {
    events.setState('teardownModule');
    events.setTest(module.__teardownModule__);
    this.wrapper(module.__teardownModule__, module);
    events.endTest(module.__teardownModule__);
  }
  module.__status__ = 'done'
}
Runner.prototype.runTestModule = function (module) {
  if (module.__requirements__ != undefined) {
    if (!arrays.inArray(this.collector.loaded_directories, module.__root_path__)) {
      this.collector.initTestDirectory(module.__root_path__);
    }
    var deps = this.getDependencies(module);
    for (i in deps) {
      var dep = deps[i];
      if (dep.status != 'done') {
        this._runTestModule(dep);
      }
    }
  }
  this._runTestModule(module);
}

var runTestDirectory = function (dir) {
  var runner = new Runner(new Collector());
  runner.runTestDirectory(dir);
  runner.end();
  return true;
}
var runTestFile = function (filename) {
  var runner = new Runner(new Collector());
  runner.runTestFile(filename);
  runner.end();
  return true;
}
