/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

var setupModule = function () {
  controller = mozmill.getBrowserController();
}

var testWaitForCallback = function () {
  expect.doesNotThrow(function () {
    controller.waitFor(function () {
      return true;
    });
  }, TypeError, "Return type 'boolean' in callback is supported.");

  expect.throws(function () {
    controller.waitFor(function () {
      return 4;
    });
  }, TypeError, "Return type 'number' in callback is not supported.");

  expect.throws(function () {
    controller.waitFor(function () {
      return "true";
    });
  }, TypeError, "Return type 'string' in callback is not supported.");

  expect.throws(function () {
    controller.waitFor(function () {
      return new Object();
    });
  }, TypeError, "Return type 'Object' in callback is not supported.");
}

var testWaitForFalseAfterTrue = function () {
  let onlyTheFirst = true;

  expect.doesNotThrow(function () {
    controller.waitFor(function () {
      let res = onlyTheFirst;
      onlyTheFirst = false;

      return res;
    }, undefined, 200);
  }, "TimeoutError", "waitFor() has to pass after the first true is returned.");
}

var testWaitForCallbackCounter = function () {
  let counter = -1;

  expect.doesNotThrow(function () {
    controller.waitFor(function () {
      counter++;
      return counter > 0;
    }, undefined, 200);
  }, "TimeoutError", "waitFor() shouldn't call callback after the first true result.");

  expect.equal(counter, 1, "waitFor() shouldn't call callback after the first true result. (Second check)");
}

var testWaitForTimeoutAccuracy = function () {
  const waitForInnerSleep = 500;
  const waitForTimeout = 2500;
  const waitForInterval = 100;

  /**
   * expectedElaspedTime constist of:
   * A - (inner sleep)ms while initializing waitFor
   * B - (interval)ms when the event loop get spinned, till the interval fires
   * C - (timeout)ms when the timeout occures
   *
   * maxAllowedDifference should aware of inner sleep
   **/
  const expectedElaspedTime = waitForInnerSleep + waitForTimeout + waitForInterval;
  const maxAllowedDifference = 2 * waitForInnerSleep;

  var time = Date.now();

  expect.throws(function () {
    controller.waitFor(function () {
      controller.sleep(waitForInnerSleep);
      return false;
    }, null, waitForTimeout, waitForInterval);
  }, "TimeoutError", "waitFor() should have run into a timeout.");

  var endTime = Date.now();
  var elaspedTime = endTime - time;
  var difference = Math.abs(expectedElaspedTime - elaspedTime);

  expect.ok(difference <= maxAllowedDifference, "Expected waitFor() timeout" +
    " is less than " + maxAllowedDifference + "ms.");
}
