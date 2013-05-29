/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

var setupModule = function () {
  browser = driver.getBrowserWindow();
}

var test = function () {
  expect.doesNotThrow(function () {
    driver.waitFor(function () {
      return true;
    }, undefined, 10, 100);
  }, "TimeoutError", "WaitFor has to pass if true is returned.");

  expect.throws(function () {
    driver.waitFor(function () {
      return false;
    }, "Throws TimeoutError", 10, 100);
  }, "TimeoutError", "waitFor() should have run into a timeout.");
}
