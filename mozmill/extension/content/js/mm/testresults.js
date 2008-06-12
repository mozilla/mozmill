/**
 * Test Result Factory
 * Creates new testResult objects for each test that track the status of each
 * test and report on whether or not a test completed successfully.  A test
 * is a script compiled of several actions, and when any of those actions (or
 * assertions) fail, then the test will fail as well.
 * The factory generates these and notifies registered listerners when a test
 * completes (i.e. the testResult object goes into a "final" state)
 */

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
