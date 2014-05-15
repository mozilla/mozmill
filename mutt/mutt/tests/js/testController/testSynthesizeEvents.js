/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

const TEST_DATA = baseurl + "form.html";

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();
}

function test() {
  controller.open(TEST_DATA);
  controller.waitForPageLoad();

  var fname = new elementslib.ID(controller.tabs.activeTab, "fname");
  var lname = new elementslib.ID(controller.tabs.activeTab, "lname");

  // Clicking the search field should raise a focus event
  fname.click(2, 2);
  expect.equal(fname.getNode(), controller.tabs.activeTab.activeElement,
               "click() put the focus to the element.");

  // Synthesize keypress event
  fname.keypress("F", {shiftKey: true});
  expect.equal(fname.getNode().value, "F",
               "keypress() with pressed shift key succeeded.");
  fname.getNode().value = "";

  // Synthesize type event
  fname.sendKeys("Fire");
  expect.equal(fname.getNode().value, "Fire",
               "type() without expected event succeeded.");

  // A focus event for the next element in the tab order should be fired
  fname.keypress("VK_TAB", {});
  expect.equal(lname.getNode(), controller.tabs.activeTab.activeElement,
               "Tab key put the focus to the next element.");
}

