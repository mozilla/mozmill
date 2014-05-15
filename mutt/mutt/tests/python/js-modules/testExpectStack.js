/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

const TEST_DATA = baseurl + "singlediv.html";

function setupModule() {
  controller = mozmill.getBrowserController();
}

function test() {
  controller.open(TEST_DATA);
  controller.waitForPageLoad();

  // Check that an invalid element element exists
  var elem = new elementslib.MozMillElement("ID", "foobar_the_friendly",
                                            {document: controller.tabs.activeTab});
  expect.ok(elem.exists(), "Element foobar_the_friendly has been found.");
}
