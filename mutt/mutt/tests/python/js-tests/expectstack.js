/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

const BASE_URL = collector.addHttpResource("../../js/_files/");
const TEST_DATA = BASE_URL + "singlediv.html";

var setupModule = function () {
  controller = mozmill.getBrowserController();
}

var test = function () {
  controller.open(TEST_DATA);
  controller.waitForPageLoad();

  // Check that an invalid element element exists
  var elem = new elementslib.MozMillElement("ID", "foobar_the_friendly",
                                            {document: controller.tabs.activeTab});
  expect.ok(elem.exists(), "Element foobar_the_friendly has been found.");
}
