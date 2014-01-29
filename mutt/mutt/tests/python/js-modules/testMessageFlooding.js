/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

Cu.import("resource://gre/modules/Services.jsm");

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();
}

function testLogMessages() {
  controller.open("https://addons.mozilla.org/en-US/firefox/licences/5.txt");
  controller.waitForPageLoad();
}

function testControl() {}
