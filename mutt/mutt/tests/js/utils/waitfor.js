var setupModule = function () {
  controller = mozmill.getBrowserController();
}

var testWaitForCallback = function () {
  expect.doesNotThrow(function () {
    controller.waitFor(function () {
      return true;
    });
  }, "TypeError", "Return type 'boolean' in callback is supported.");

  expect.throws(function () {
    controller.waitFor(function () {
      return 4;
    });
  }, "TypeError", "Return type 'number' in callback is not supported.");

  expect.throws(function () {
    controller.waitFor(function () {
      return "true";
    });
  }, "TypeError", "Return type 'string' in callback is not supported.");

  expect.throws(function () {
    controller.waitFor(function () {
      return new Object();
    });
  }, "TypeError", "Return type 'Object' in callback is not supported.");
}

var testWaitForFalseAfterTrue = function () {
  let onlyTheFirst = true;

  expect.doesNotThrow(function () {
    controller.waitFor(function () {
      let res = onlyTheFirst;
      onlyTheFirst = false;

      return res;
    }, undefined, 200, 0);
  }, "TimeoutError", "waitFor() has to pass after the FIRST true is returned.");
}

var testWaitForCallbackCounter = function () {
  let counter = -1;
  
  expect.doesNotThrow(function () {
    controller.waitFor(function () {
      counter++;
      return counter > 0;
    }, undefined, 200, 0);
  }, "TimeoutError", "waitFor() shouldn't call callback after the first true result.");

  expect.equal(counter, 1, "waitFor() shouldn't call callback after the first true result. (Second check)");
}

var testWaitForTimeoutAccuracy = function () {
  const expectedElaspedTime = 500 + 2500 + 100;
  const maxAllowedDifference = 1000;

  var time = Date.now();
  var counter = 1;

  dump("start time: " + time + "\n");
  try {
    assert.throws(function () {
      controller.waitFor(function () {
        dump("iteration: " + counter + ", time elapsed = " + (Date.now() - time) + "\n");
        counter++;
        controller.sleep(500);
        return false;
      }, null, 2500, 100);
    }, "TimeoutError", "waitFor() should have run into a timeout.");
  }
  finally {
    var endTime = Date.now();
    var elaspedTime = endTime - time;
    var difference = Math.abs(expectedElaspedTime - elaspedTime);
    dump("end time: " + endTime + "\n");
    dump("final time elapsed: " + elaspedTime + "\n");
    dump("difference: " + difference + "ms\n");
  }

  expect.ok(
    (difference <= maxAllowedDifference),
    "waitFor's timeout accuracy should be in " + maxAllowedDifference + "ms" +
      ", currently: " + difference + "ms"
  );
}
