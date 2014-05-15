/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const TEST_DATA = [
  baseurl + "link.html",
  baseurl + "no_bfcache.html",
  "about:blank",
  "about:blocked",
  "about:addons",
  "about:config",
  "about:newtab"
];

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();
}

function testReloadPageAfterTabChange() {
  TEST_DATA.forEach(function (aUrl) {
    controller.open(aUrl);
    controller.waitForPageLoad();

    // Open a new tab and close it
    controller.mainMenu.click("#menu_newNavigatorTab");
    controller.mainMenu.click("#menu_close");

    controller.open(aUrl);
    controller.waitForPageLoad();
  });
}
