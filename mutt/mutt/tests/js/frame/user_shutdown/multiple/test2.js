/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

var setupModule = function () {
  controller = mozmill.getBrowserController();
}

// This test should pass
var testShutdownBeforeTimeout = function () {
  controller.startUserShutdown(10000, false);
  controller.mainMenu.click("#menu_FileQuitItem");
  controller.sleep(1000);
}
