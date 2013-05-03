/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

const TEST_FOLDER = collector.addHttpResource('../_files/');
const TEST_PAGE = TEST_FOLDER + "singlediv.html";

var setupModule = function () {
  controller = mozmill.getBrowserController();
}

var test = function () {
  controller.open(TEST_PAGE);
  controller.waitForPageLoad();

  var id = new elementslib.ID(controller.tabs.activeTab, "test-div");
  var elem = new elementslib.MozMillElement("Elem", null,
    {'element': controller.tabs.activeTab.getElementById("test-div")});

  assert.ok(id.getNode(), "Element via ID() has been found.");
  assert.ok(elem.getNode(), "Element via Elem() has been found.");

  controller.open(TEST_PAGE);
  controller.waitForPageLoad();

  assert.ok(id.getNode(), "Element via ID() can still be found after a page load.");
  assert.ok(!elem.getNode(), "Element via Elem() can not be found after a page load.");
}
