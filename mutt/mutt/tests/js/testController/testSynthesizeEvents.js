/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

const BASE_URL = collector.addHttpResource("../../data/");
const TEST_DATA = BASE_URL + "form.html";

var setupModule = function () {
  controller = mozmill.getBrowserController();
}

var test = function () {
  controller.open(TEST_DATA);
  controller.waitForPageLoad();

  var fname = new elementslib.ID(controller.tabs.activeTab, "fname");
  var lname = new elementslib.ID(controller.tabs.activeTab, "lname");

  // Clicking the search field should raise a focus event
  controller.click(fname, 2, 2);
  expect.equal(fname.getNode(), controller.tabs.activeTab.activeElement,
               "click() put the focus to the element.");

  // Synthesize keypress event
  controller.keypress(fname, "F", {shiftKey: true});
  expect.equal(fname.getNode().value, "F",
               "keypress() with pressed shift key succeeded.");
  fname.getNode().value = "";

  // Synthesize type event
  controller.type(fname, "Fire");
  expect.equal(fname.getNode().value, "Fire",
               "type() without expected event succeeded.");

  // A focus event for the next element in the tab order should be fired
  controller.keypress(fname, "VK_TAB", {});
  expect.equal(lname.getNode(), controller.tabs.activeTab.activeElement,
               "Tab key put the focus to the next element.");
}

