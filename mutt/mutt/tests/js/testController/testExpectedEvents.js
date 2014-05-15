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

  let fname = new elementslib.ID(controller.tabs.activeTab, "fname");
  let lname = new elementslib.ID(controller.tabs.activeTab, "lname");

  expect.doesNotThrow(function () {
    fname.click(2, 2, {type: "focus"});
  }, "Error", "click() on a text field raises a focus event.");

  expect.throws(function () {
    fname.click(2, 2, {type: "keypress"});
  }, "Error", "click() on a text field does not raise a keypress event.");

  // Synthesize keypress event
  expect.doesNotThrow(function () {
    fname.keypress("i", {}, {type: "keypress"});
  }, "Error", "keypress() does fire a keypress event.");
  expect.equal(fname.getNode().value, "i", "text field contains the expected value.");
  fname.getNode().value = "";

  expect.doesNotThrow(function () {
    fname.sendKeys("fox", {type: "keypress"});
  }, "Error", "type() does fire a keypress event.");
  expect.equal(fname.getNode().value, "fox", "text field contains the expected value.");

  expect.doesNotThrow(function () {
    fname.keypress("a", {accelKey: true}, {type: "keypress"});
  }, "Error", "Using Cmd/Ctrl+A should fire a select event on that element.");

  expect.doesNotThrow(function () {
    fname.keypress("VK_TAB", {}, {type: "focus", target: lname});
  }, "Error", "The tab key focuses the next element in the tab order.");

  expect.throws(function () {
    lname.rightClick(2, 2, {type: "click"});
  }, "Error", "Opening a context menu shouldn't raise a click event.");
  lname.keypress("VK_ESCAPE");

  expect.doesNotThrow(function () {
    lname.rightClick(2, 2, {type: "contextmenu"});
  }, "Error", "Opening a context menu does fire a contextmenu event.");
  lname.keypress("VK_ESCAPE");

  expect.throws(function () {
    lname.keypress("VK_TAB", {}, {target: lname});
  }, "Error", "Missing expected event type has to throw an exception.");
}
