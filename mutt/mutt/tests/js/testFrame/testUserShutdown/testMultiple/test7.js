/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

var setupModule = function () {
  controller = mozmill.getBrowserController();
}

// This test should fail
var testShutdownAfterTimeout = function () {
  controller.startUserShutdown(1000, false);
  controller.sleep(2000);
  controller.mainMenu.click("#menu_FileQuitItem");
}
