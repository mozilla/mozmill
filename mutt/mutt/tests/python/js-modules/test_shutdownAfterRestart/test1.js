/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

function setupTest(aModule) {
  aModule.controller = mozmill.getBrowserController();
}

function test1() {
  controller.restartApplication("test2");
}

function test2() {
  controller.stopApplication(true);
}
