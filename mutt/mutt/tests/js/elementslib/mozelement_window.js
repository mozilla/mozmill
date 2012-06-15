/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const TEST_FOLDER = collector.addHttpResource('../_files/');

// Bug 677364:
// Fix controller keyboard methods to allow a null parameter for the target element

var setupModule = function () {
  controller = mozmill.getBrowserController();

  win = new mozelement.MozMillElement("Elem", controller.window);
}

var testContent = function () {
  controller.open(TEST_FOLDER + "form.html");
  controller.waitForPageLoad();

  let textbox = new elementslib.ID(controller.tabs.activeTab, "fname");

  // Focus the textbox
  textbox.click(textbox);

  // A key event sent to the window will be propagated to the
  // currently active element.
  win.keypress("t");
  expect.equal(textbox.getNode().value, "t",
               "keypress added letter to textbox.");
}

var testChrome = function () {
  let urlbar = new findElement.ID(controller.window.document, "urlbar");

  // Focus the location bar
  urlbar.click(urlbar);

  // A key event sent to the window will be propagated to the
  // currently active element.
  win.keypress("t", { });
  expect.equal(urlbar.getNode().value, "t",
               "keypress added letter to location bar.");
}
