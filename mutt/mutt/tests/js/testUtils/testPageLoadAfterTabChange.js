/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

var setupModule = function () {
  controller = mozmill.getBrowserController();
}

var testPageLoadAfterTabChange = function () {
  // Navigate to about:newtab
  controller.open("about:newtab");
  controller.waitForPageLoad();

  // Open a new tab and close it
  controller.mainMenu.click("#menu_newNavigatorTab");
  controller.mainMenu.click("#menu_close");

  // Try to navigate to same page
  controller.open("about:newtab");
  controller.waitForPageLoad();
}