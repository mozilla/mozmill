/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

const TEST_DATA = baseurl + "form.html";

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();

  // Create a new menu instance for the context menu
  aModule.contextMenu = aModule.controller.getMenu("#contentAreaContextMenu");
}

function testMenu() {
  controller.open(TEST_DATA);
  controller.waitForPageLoad();

  // Enter text in a text field and select all via the context menu
  var field = new elementslib.ID(controller.tabs.activeTab, "fname");
  field.sendKeys("mozmill");
  contextMenu.select("#context-selectall", field);

  // Reopen the context menu and check the 'Paste' menu item
  contextMenu.open(field);
  expect.ok(contextMenu.getItem("#context-viewimage").getNode().hidden,
            "Context menu entry 'View Image' is not visible");

  // Remove the text by selecting 'Undo'
  contextMenu.keypress("VK_DOWN", {});
  contextMenu.keypress("VK_RETURN", {});
  contextMenu.close();

  expect.equal(field.getNode().value, "", "Text field has been emptied.");
}
