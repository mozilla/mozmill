/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

const BASE_URL = collector.addHttpResource("../data/");
const TEST_DATA = BASE_URL + "form.html";

var setupModule = function () {
  controller = mozmill.getBrowserController();
}

var test = function () {
  controller.open(TEST_DATA);
  controller.waitForPageLoad();

  let fname = new elementslib.ID(controller.tabs.activeTab, "fname");
  let lname = new elementslib.ID(controller.tabs.activeTab, "lname");

  expect.doesNotThrow(function () {
    controller.click(fname, 2, 2, {type: "focus"});
  }, "Error", "click() on a text field raises a focus event.");

  expect.throws(function () {
    controller.click(fname, 2, 2, {type: "keypress"});
  }, "Error", "click() on a text field does not raise a keypress event.");

  // Synthesize keypress event
  expect.doesNotThrow(function () {
    controller.keypress(fname, "i", {}, {type: "keypress"});
  }, "Error", "keypress() does fire a keypress event.");
  expect.equal(fname.getNode().value, "i", "text field contains the expected value.");
  fname.getNode().value = "";

  expect.doesNotThrow(function () {
    controller.type(fname, "fox", {type: "keypress"});
  }, "Error", "type() does fire a keypress event.");
  expect.equal(fname.getNode().value, "fox", "text field contains the expected value.");

  expect.doesNotThrow(function () {
    controller.keypress(fname, "a", {accelKey: true}, {type: "keypress"});
  }, "Error", "Using Cmd/Ctrl+A should fire a select event on that element.");

  expect.doesNotThrow(function () {
    controller.keypress(fname, "VK_TAB", {}, {type: "focus", target: lname});
  }, "Error", "The tab key focuses the next element in the tab order.");

  expect.throws(function () {
    controller.rightClick(lname, 2, 2, {type: "click"});
  }, "Error", "Opening a context menu shouldn't raise a click event.");
  controller.keypress(lname, "VK_ESCAPE", {type: "keypress"});

  expect.doesNotThrow(function () {
    controller.rightClick(lname, 2, 2, {type: "contextmenu"});
  }, "Error", "Opening a context menu does faire a contextmenu event.")
  controller.keypress(lname, "VK_ESCAPE", {type: "keypress"});

  expect.throws(function () {
    controller.keypress(lname, "VK_TAB", {}, {target: lname});
  }, "Error", "Missing expected event type has to throw an exception.");
}
