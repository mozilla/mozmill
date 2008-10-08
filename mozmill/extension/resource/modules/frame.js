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

var EXPORTED_SYMBOLS = ['loadFile','register_function','Collector','Runner','events'];

var os = {};      Components.utils.import('resource://mozmill/stdlib/os.js', os);
var strings = {}; Components.utils.import('resource://mozmill/stdlib/strings.js', strings);
var arrays = {};  Components.utils.import('resource://mozmill/stdlib/arrays.js', arrays);
var results = {}; Components.utils.import('resource://mozmill/modules/results.js', results);
var withs = {}; Components.utils.import('resource://mozmill/stdlib/withs.js', withs);

var ios = Components.classes["@mozilla.org/network/io-service;1"]
                    .getService(Components.interfaces.nsIIOService);
var loader = Components.classes["@mozilla.org/moz/jssubscript-loader;1"]
                    .getService(Components.interfaces.mozIJSSubScriptLoader);

var backstage = this;

var registeredFunctions = {};

var loadFile = function(path) {
  var file = Components.classes["@mozilla.org/file/local;1"]
                       .createInstance(Components.interfaces.nsILocalFile);
  file.initWithPath(path);
  uri = ios.newFileURI(file).spec;

  var module = {};  
  module.registeredFunctions = registeredFunctions;
  loader.loadSubScript(uri, module);
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
  events.fireEvent(cmeta, v);
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
  events.fireEvent('setTest', test);
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
}
events.addListener = function (name, listener) {
  if (this.listeners[name]) {
    this.listeners[name].push(listener);
  } else {
    this.listeners[name] = [listener];
  }
}

function Collector () {
  this.test_modules_by_filename = {};
  this.test_modules_by_name = {};
  this.requirements_run = {};
  this.all_requirements = [];
  this.testing = [];
}
Collector.prototype.initTestModule = function (filename) {
  var test_module = loadFile(filename);
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
    if (i == "MODULE_REQUIRES") {
      test_module.__requirements__ = test_module[i];
      this.all_requirements.push.apply(backstage, test_module[i]);
    }
    if (i == "MODULE_NAME") {
      test_module.__module_name__ = test_module[i];
      this.test_modules_by_name[test_module[i]] = test_module;
    }
  }
  this.test_modules_by_filename[filename] = test_module;
  return test_module;
}
Collector.prototype.initTestDirectory = function (directory) {
  var r = this;
  function recursiveModuleLoader(dfile) {
    var dfiles = os.listDirectory(dfile);
    for (i in dfiles) {
      var f = dfiles[i];
      if ( f.isDirectory() && !withs.startsWith(f.leafName, '.') ) {
        recursiveModuleLoader(f.path);
      } else if ( withs.startsWith(f.leafName, "test") && withs.endsWith(f.leafName, ".js") ) {
        r.initTestModule(f.path);
      }
      r.testing.push(f.path);
    }
  }
  recursiveModuleLoader(os.getFileForPath(directory));
}

function Runner (collector) {
  this.collector = collector;
}
Runner.prototype.runTestFile = function (directory) {
  if ( !arrays.inArray(this.test_modules_by_filename, directory) ) {
    this.collector.initTestModule(directory);
  }
  this.runTestModule(this.collector.test_modules_by_filename[directory]);
}
Runner.prototype.getDependencies = function (module) {
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
Runner.prototype._runTestModule = function (module) {
  var attrs = [];
  for (i in module) {
    attrs.push(i);
  }
  events.setModule(module);
  module.registeredFunctions = registeredFunctions;
  if (module.__setupModule__) { 
    events.setState('setupModule');
    events.setTest(module.__setupModule__)
    module.__setupModule__(module); 
    }
  for (i in module.__tests__) {
    var test = module.__tests__[i];
    test.registeredFunctions = registeredFunctions;
    if (module.__setupTest__) { 
      events.setState('setupTest');
      events.setTest(module.__setupTest__);
      module.__setupTest__(test); 
      }  
    events.setState('test'); 
    events.setTest(test);
    test();
    if (module.__teardownTest___) {
      events.setState('teardownTest'); 
      events.setTest(module.__teardownTest__)
      module.__teardownTest__(test); 
      }
  }
  if (module.__teardownModule__) {
    events.setState('teardownModule');
    events.setTest(module.__teardownModule__)
    module.__teardownModule__(module);
  }
}
Runner.prototype.runTestModule = function (module) {
  events.setState('dependencies')
  var deps = this.getDependencies(module);
  for (i in deps) {
    var dep = deps[i];
    this._runTestModule(dep);
  }
  this._runTestModule(module);
}
