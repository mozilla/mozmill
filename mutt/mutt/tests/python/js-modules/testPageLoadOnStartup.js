/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

const BASE_URL = collector.addHttpResource("./_files/");
const TEST_DATA = BASE_URL + "singlediv.html";

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();
}

function testWaitForPageLoadOnStartup() {
  controller.open(TEST_DATA);
  controller.waitForPageLoad();

  var elem = new elementslib.ID(controller.tabs.activeTab, "test-div");
  expect.ok(elem.exists(), "input field has been found");
}
