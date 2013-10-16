/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();
}

function testWaitForCallback() {
  expect.doesNotThrow(function () {
    assert.waitFor(function () {
      return true;
    });
  }, TypeError, "Return type 'boolean' in callback is supported.");

  expect.throws(function () {
    assert.waitFor(function () {
      return 4;
    });
  }, TypeError, "Return type 'number' in callback is not supported.");

  expect.throws(function () {
    assert.waitFor(function () {
      return "true";
    });
  }, TypeError, "Return type 'string' in callback is not supported.");

  expect.throws(function () {
    assert.waitFor(function () {
      return new Object();
    });
  }, TypeError, "Return type 'Object' in callback is not supported.");
}

function testWaitForFalseAfterTrue() {
  let onlyTheFirst = true;

  expect.doesNotThrow(function () {
    assert.waitFor(function () {
      let res = onlyTheFirst;
      onlyTheFirst = false;

      return res;
    }, undefined, 200);
  }, errors.AsserionError, "waitFor() has to pass after the first true is returned.");
}

function testWaitForCallbackCounter() {
  let counter = -1;

  expect.doesNotThrow(function () {
    assert.waitFor(function () {
      counter++;
      return counter > 0;
    }, undefined, 200);
  }, errors.AsserionError, "waitFor() shouldn't call callback after the first true result.");

  expect.equal(counter, 1, "waitFor() shouldn't call callback after the first true result. (Second check)");
}

function testWaitForTimeoutAccuracy() {
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
    assert.waitFor(function () {
      controller.sleep(waitForInnerSleep);
      return false;
    }, null, waitForTimeout, waitForInterval);
  }, errors.AsserionError, "waitFor() should have run into a timeout.");

  var endTime = Date.now();
  var elaspedTime = endTime - time;
  var difference = Math.abs(expectedElaspedTime - elaspedTime);

  expect.ok(difference <= maxAllowedDifference, "Expected waitFor() timeout" +
                                                " is less than " + maxAllowedDifference + "ms.");
}
