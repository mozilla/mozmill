/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

const TEST_DATA = baseurl + "link.html";

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();
}

function test() {
  controller.open(TEST_DATA);
  controller.waitForPageLoad();

  let link = new elementslib.ID(controller.tabs.activeTab, "link");
  link.click(undefined, undefined, undefined, true);
  controller.waitForPageLoad();

  let div = new elementslib.ID(controller.tabs.activeTab, "test-div");
  expect.ok(div.exists, "Native click event has been send successfully.");
}
