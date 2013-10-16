/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

function setupModule(aModule) {
  aModule.browser = driver.getBrowserWindow();
}

function test() {
  expect.ok(browser, "A browser window has been found");

  var browser2 = driver.openBrowserWindow();
  expect.ok(browser2, "A new browser window has been opened");
  expect.notEqual(browser, browser2, "The second browser window is different");
  browser2.close();
}
