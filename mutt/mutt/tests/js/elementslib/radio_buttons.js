/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const TEST_FOLDER = collector.addHttpResource('../_files/');


var setupModule = function () {
  controller = mozmill.getBrowserController();
}

var test = function () {
  // Test content
  controller.open(TEST_FOLDER + "radio_button.html");
  controller.waitForPageLoad();

  let radio1 = findElement.ID(controller.tabs.activeTab, "radio1");
  radio1.select();
  expect.ok(radio1.getNode().checked, "First radio button has been selected.");

  let radio2 = findElement.ID(controller.tabs.activeTab, "radio2");
  radio2.select();
  expect.ok(radio2.getNode().checked, "Second radio button has been selected.");

  // Test chrome (XUL)
  prefs = mozmill.getPreferencesController();

  var radiogroup = findElement.ID(prefs.window.document, "saveWhere");
  radiogroup.select(0);
  expect.equal(radiogroup.getNode().selectedIndex, 0, "First radio button has been selected.");

  radiogroup.select(1);
  expect.equal(radiogroup.getNode().selectedIndex, 1, "Second radio button has been selected.");
}
