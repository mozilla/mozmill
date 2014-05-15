/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

const TEST_DATA = baseurl + "form.html";

// Bug 677364:
// Fix controller keyboard methods to allow a null parameter for the target element

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();

  aModule.win = new findElement.Elem(aModule.controller.window);
}

function testContent() {
  controller.open(TEST_DATA);
  controller.waitForPageLoad();

  let textbox = new findElement.ID(controller.tabs.activeTab, "fname");

  // Focus the textbox
  textbox.click();

  // A key event sent to the window will be propagated to the
  // currently active element.
  win.keypress("t");
  expect.equal(textbox.getNode().value, "t",
               "keypress added letter to textbox.");
}

function testChrome() {
  controller.open('about:blank');
  controller.waitForPageLoad();

  let urlbar = new findElement.ID(controller.window.document, "urlbar");

  // Focus the location bar
  urlbar.click();

  // A key event sent to the window will be propagated to the
  // currently active element.
  win.keypress("t", { });
  expect.equal(urlbar.getNode().value, "t",
               "keypress added letter to location bar.");
}
