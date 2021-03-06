/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();
}

function testSleep() {
  controller.mainMenu.click("#menu_FileQuitItem");

  controller.sleep(persisted.waitTime);
}
