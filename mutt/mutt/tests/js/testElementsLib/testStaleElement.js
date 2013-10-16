/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

const BASE_URL = collector.addHttpResource("../../data/");
const TEST_DATA = BASE_URL + "singlediv.html";

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();
}

function test() {
  controller.open(TEST_DATA);
  controller.waitForPageLoad();

  var id = new elementslib.ID(controller.tabs.activeTab, "test-div");
  var elem = new elementslib.MozMillElement("Elem", null,
    {'element': controller.tabs.activeTab.getElementById("test-div")});

  assert.ok(id.getNode(), "Element via ID() has been found.");
  assert.ok(elem.getNode(), "Element via Elem() has been found.");

  controller.open(TEST_DATA);
  controller.waitForPageLoad();

  assert.ok(id.getNode(), "Element via ID() can still be found after a page load.");
  assert.ok(!elem.getNode(), "Element via Elem() can not be found after a page load.");
}
