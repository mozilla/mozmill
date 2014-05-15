/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

TEST_DATA = baseurl + "singlediv.html"

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();
}

function testServerRoot() {
  controller.open(TEST_DATA);
  controller.waitForPageLoad();

  var elem = findElement.ID(controller.tabs.activeTab, "test-div");
  assert.ok(elem.exists(), "Element has been found.");
}
