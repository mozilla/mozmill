/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

function setupTest(aModule) {
  aModule.controller = mozmill.getBrowserController();
}

// This test will pass
function testShutdownBeforeTimeout() {
  controller.startUserShutdown(2000, false);
  controller.sleep(1000);
  controller.mainMenu.click("#menu_FileQuitItem");
}
