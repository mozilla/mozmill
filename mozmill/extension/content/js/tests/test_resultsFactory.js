function myObserver()
{
  this.register();
}
myObserver.prototype = {
  observe: function(subject, topic, data) {
    dump("**** We got an event! With topic: " + topic + " \n");
    //alert("**** We got an event!");
  },
  register: function() {
    var observerService = Components.classes["@mozilla.org/observer-service;1"]
                          .getService(Components.interfaces.nsIObserverService);
    observerService.addObserver(this, "xul-window-registered", false);
    observerService.addObserver(this, "domwindowopened", false);
    observerService.addObserver(this, "xul-window-visible", false);
    
  },
  unregister: function() {
    var observerService = Components.classes["@mozilla.org/observer-service;1"]
                            .getService(Components.interfaces.nsIObserverService);
    observerService.removeObserver(this, "xul-window-registered");
  }
}

var gOb;

function goObservers() {
  gOb = new myObserver();
}

function runResultFactoryTests() {
  try {
    // Make sure that we have a factory
    if (typeof(mozmill.resultFactory) == "undefined") {
      testLog("no mozmill factory");
      setStatus(false);
      return;
    }

    // Make a callback
    var callback = {
      testStarting: function ts(aTestResult) {
        testLog("The " + aTestResult.name + " is starting");
      },
      testFinished: function tf(aTestResult) {
        testLog("the " + aTestResult.name + " is finished");
      }
    };

    // register the callback
    mozmill.resultFactory.registerListener(callback);

    // Now create some result objects
    var res1 = mozmill.resultFactory.generateTestResult("test1", "suite1");
    // start the test!
    res1.startTest();
    // finish the test! - no debug message
    res1.finishTest("PASSED", 1);

    var res2 = mozmill.resultFactory.generateTestResult("test2", "suite1");
    res2.startTest();
    res2.finishTest("FAILED", 13, "Oh No! It failed!");

    var res3 = mozmill.resultFactory.generateTestResult("test3", "suite3");
    res3.startTest();
    res3.finishTest("PAssed", 14, "Oh no, it is case sensitive");

    // Test the result Iterator in the factory
    for(r in mozmill.resultFactory.resultList) {
      testLog("Result Object: Name: " + r.name + " suite: " + r.suite + " testPassed: " +
              r.testPassed + " time: " + r.time + " uuid: " + r.uuid + " debug: " + r.debug);
    }
/*    var r = mozmill.resultFactory.resultList.getNext();
    while(r ) {
      testLog("Result Object: Name: " + r.name + " suite: " + r.suite + " testPassed: " +
              r.testPassed + " time: " + r.time + " uuid: " + r.uuid + " debug: " + r.debug);
      r = mozmill.resultFactory.resultList.getNext();
    }*/
  } catch(ex) {
    testLog("Somthing threw: " + ex);
    setStatus(false);
    return;
  }
  testLog("All tests completed");
  setStatus(true);
}

function setStatus(isPassed) {
  var status = document.getElementById("testResultFactory-Status");
  status.setAttribute("value", isPassed ? "PASSED" : "FAILED");
}

function testLog(str) {
  dump("\n *****" + str + "*****\n");
}
