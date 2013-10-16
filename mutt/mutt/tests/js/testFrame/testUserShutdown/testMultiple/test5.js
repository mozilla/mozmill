/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();
}

function teardownModule(aModule) {
  aModule.controller.startUserShutdown(1000, false);
  controller.mainMenu.click("#menu_FileQuitItem");
}
