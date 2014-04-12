/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

const BASE_URL = collector.addHttpResource("../../data/");
const TEST_DATA = BASE_URL + "link.html";

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();

  aModule.urlbar = new elementslib.ID(aModule.controller.window.document, "urlbar");
}

function test() {
  controller.open(TEST_DATA);
  controller.waitForPageLoad();

  let link = new elementslib.ID(controller.tabs.activeTab, "link");
  link.waitForElement();
  link.dragToElement(urlbar);
  controller.waitForPageLoad();

  let div = new elementslib.ID(controller.tabs.activeTab, "test-div");
  assert.ok(div.exists(), "Found test-div.");
}
