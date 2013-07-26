/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const BASE_URL = collector.addHttpResource("../data/");
const TEST_DATA = [
  BASE_URL + "form.html",
  "chrome://mozmill/content/test/chrome_elements.xul"
];

var setupModule = function (aModule) {
  aModule.controller = mozmill.getBrowserController();
}

var testContentSelect = function () {
  controller.open(TEST_DATA[0]);
  controller.waitForPageLoad();

  var dropdown = new elementslib.ID(controller.tabs.activeTab, "state");

  // Select by index, item not in view
  dropdown.select(20);
  expect.equal(dropdown.getNode().selectedIndex, 20, "Index has been selected")
  expect.equal(dropdown.getNode().value, "MD", "Value has been selected");

  // Select by value
  dropdown.select(null, null, 'AK');
  expect.equal(dropdown.getNode().value, "AK", "Value has been selected");

  // Select by option
  dropdown.select(null, 'Alabama');
  expect.equal(dropdown.getNode().value, "AL", "Value has been selected");
}

var testChromeSelect = function () {
  controller.open(TEST_DATA[1]);
  controller.waitForPageLoad();

  var menulist = new elementslib.ID(controller.window.document, "menulist");

  // Select by index, item not in view
  menulist.select(20);
  expect.equal(menulist.getNode().selectedIndex, 20, "Index has been selected")
  expect.equal(menulist.getNode().value,'MD', "Value has been selected");

  // Select by value
  menulist.select(null, null, 'AZ');
  expect.equal(menulist.getNode().value, 'AZ', "Value has been selected");

  // Select by option
  menulist.select(null, 'Missouri');
  expect.equal(menulist.getNode().value, 'MO', "Value has been selected");
}
