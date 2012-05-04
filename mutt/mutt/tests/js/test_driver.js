/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

function setupModule(module) {
  module.browser = driver.getBrowserWindow();
}


/**
 * Tests for synchronization related methods
 */
function testDriver() {
  expect.notEqual(browser, null, "A browser window has been found");

  var browser2 = driver.openBrowserWindow();
  expect.notEqual(browser2, null, "A new browser window has been opened");
  expect.notEqual(browser, browser2, "The second browser window is different");
  browser2.close();

  driver.sleep(100);

  // Test waitFor wrapper
  try {
    driver.waitFor(function () {
      return true;
    }, undefined, 10, 100);
  }
  catch (ex) {
    expect.fail("WaitFor has to pass if true is returned.");
  }

  try {
    driver.waitFor(function () {
      return false;
    }, "Throws TimeoutError", 10, 100);
    expect.fail("WaitFor has to fail if false is returned.");
  }
  catch (ex) {
    expect.equal(ex.name, "TimeoutError", "exception is of type TimeoutError");
    expect.equal(ex.message, "Throws TimeoutError", "The correct message has been set");
  }
}
