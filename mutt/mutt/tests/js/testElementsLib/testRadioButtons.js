/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

const BASE_URL = collector.addHttpResource("../../data/");
const TEST_DATA = BASE_URL + "radio_button.html";

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();
}

function test() {
  // Test content
  controller.open(TEST_DATA);
  controller.waitForPageLoad();

  let radio1 = findElement.ID(controller.tabs.activeTab, "radio1");
  radio1.select();
  expect.ok(radio1.getNode().checked, "First radio button has been selected.");

  let radio2 = findElement.ID(controller.tabs.activeTab, "radio2");
  radio2.select();
  expect.ok(radio2.getNode().checked, "Second radio button has been selected.");

  // Test chrome (XUL)
  controller.open("chrome://mozmill/content/test/radio_buttons.xul");
  controller.waitForPageLoad();

  var radiogroup = findElement.ID(controller.tabs.activeTab, "saveWhere");
  radiogroup.select(0);
  expect.equal(radiogroup.getNode().selectedIndex, 0, "First radio button has been selected.");

  radiogroup.select(1);
  expect.equal(radiogroup.getNode().selectedIndex, 1, "Second radio button has been selected.");
}
