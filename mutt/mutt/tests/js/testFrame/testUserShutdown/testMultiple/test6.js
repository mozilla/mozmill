/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

var setupModule = function () {
  controller = mozmill.getBrowserController();

  controller.startUserShutdown(1000, false);
  controller.mainMenu.click("#menu_FileQuitItem");
}

var setupTest = function () {
  assert.fail("setupTest should not have been run.");
}

var testSkip = function () {
  assert.fail("The test should not have been run.");
}

var teardownTest = function () {
  assert.fail("teardownTest should not have been run.");
}

var teardownModule = function () {
  assert.fail("teardownModule should not have been run.");
}
