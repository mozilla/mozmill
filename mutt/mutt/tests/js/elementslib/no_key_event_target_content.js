/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const TEST_FOLDER = collector.addHttpResource('../_files/');


var setupModule = function () {
  controller = mozmill.getBrowserController();
}

// Bug 677364:
// Fix controller keyboard methods to allow a null parameter for the target element
var test = function () {
  controller.open(TEST_FOLDER + "form.html");
  controller.waitForPageLoad();

  let textbox = new elementslib.ID(controller.tabs.activeTab, "fname");

  // Focus the textbox first
  controller.click(textbox);

  controller.keypress(null, "t", { });
  expect.equal(textbox.getNode().value, "t", "keypress added letter to textbox.");
  textbox.getNode().value = "";

  controller.type(null, "Firefox");
  expect.equal(textbox.getNode().value, "Firefox", "sendKeys added letters to textbox.");
}
