/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

const TEST_DATA = baseurl + "form.html";

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();

  // Clear complete history so we don't get interference from previous entries
  var browserHistory = Cc["@mozilla.org/browser/nav-history-service;1"].
                       getService(Ci.nsIBrowserHistory);
  browserHistory.removeAllPages();
}

function testDynamicMenuEntry() {
  controller.open(TEST_DATA);
  controller.waitForPageLoad();

  // Check if current page appears in history-menu
  expect.ok(controller.mainMenu.getItem(
            "[label='" + controller.tabs.activeTab.title + "']"),
            "History-menu contains current page");
}
