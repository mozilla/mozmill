/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const TEST_DATA = baseurl + "complex.html";
const TEXT_SELECTION = "Community";

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();
}

function testTap() {
  controller.open(TEST_DATA);
  controller.waitForPageLoad();

  // Grab the element and issue a doubleTap to select the text
  var element = new findElement.Name(controller.tabs.activeTab, "community");
  element.doubleTap();

  // Check that the text has been properly selected
  var selection = controller.tabs.activeTabWindow.getSelection();
  expect.equal(selection.toString(), TEXT_SELECTION,
               "Text has been properly selected");
}
