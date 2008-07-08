// ***** BEGIN LICENSE BLOCK *****
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
// Adam Christian.
// Portions created by the Initial Developer are Copyright (C) 2008
// the Initial Developer. All Rights Reserved.
// 
// Contributor(s):
//  Adam Christian <adam.christian@gmail.com>
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

var EXPORTED_SYMBOLS = [""];

function testResultFactory() {
  this.init();
}

testResultFactory.prototype = {
  /* The Currently executing test */
  currentTestName: null,

  /* Current test Result Object */
  currentTestResult: null,

  listeners: [],

  /* The list of result objects for the entire test run */
  resultList: {
    list: [],
    add: function add(testResult) {
      this.list.push(testResult);
    },
    __iterator__: function() {
      var i;
      for (i=0; i < this.list.length; i++) {
        yield this.list[i];
      }
    },
    clear: function clear() {
      this.list = [];
    }
  },

  /* Initialize our object */
  init: function init() {
    // TODO: make this into a LOG function from a utils script
    dump("mozmill testResultFactory Starting\n");
    // Nothing else to do here at the moment.
  },

  /* Adds a listener to our list */
  registerListener: function registerListener(aTestResultListener) {
    this.listeners.push(aTestResultListener);
  },

  /* Calls the testStarting method of all listeners 
   * TODO: Make this more asynchronous? And do we really need to notify on
   *       startup?  Shouldn't that be the job of jsTest?
   */
  testCallbacks: {
    parent: this.testResultFactory,
    notifyTestStarting: function notifyTestStarting(aTestResult) {
      for(var i=0; i < this.parent.prototype.listeners.length; i++) {
        this.parent.prototype.listeners[i].testStarting(aTestResult);
      }
    },
    notifyTestFinished: function notifyTestFinished(aTestResult) {
      for(var i=0; i < this.parent.prototype.listeners.length; i++) {
        this.parent.prototype.listeners[i].testFinished(aTestResult);
      }
    }
  },

  /* Called to Generate a testResult Object */
  generateTestResult: function generateTestResult(name, suite) {
    var r = new testResult(name, suite, this.testCallbacks);
    dump("\n**** About to try to add the result to the resultList ***\n");
    dump("**** resultList length = " + this.resultList.length + "\n");
    this.resultList.add(r);
    return r;
  }
};

/**
 * The test Result object - accumulates result data for a specific test
 */
function testResult(aName, aSuite, aFactoryCallback) {
  this.name = aName;
  this.suite = aSuite;
  this.callback = aFactoryCallback;
  var dt = new Date();
  this.uuid = dt.getTime();
}

testResult.prototype = {
  name: null,
  testPassed: false,
  time: null,
  uuid: null,
  debug: null,
  suite: null,
  callback: null,

  // TODO: I really doubt this should be here - why does result care when the
  // test is started?  If we need notification on start of test that should be
  // jsTest's job to signal everyone about that.
  // We probably need a real xpcom service that inhereits from nsIObserver
  // and allows everyone to register a listener on that observer to be informed
  // when the events happen.
  startTest: function startTest() {
    this.callback.notifyTestStarting(this);
  },

  // I think we do need the finishTest though.
  finishTest: function finishTest(aStatus, aTime, aError) {
    this.testPassed = aStatus == "PASSED";
    this.time = aTime;
    this.debug = aError ? aError : "";

    this.callback.notifyTestFinished(this);
  }
};

// Create our factory as a singleton
if (typeof(mozmill.resultFactory) == "undefined") {
  mozmill.resultFactory = new testResultFactory();
}
