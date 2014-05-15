/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

const TEST_DATA = baseurl + "singlediv.html";

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();
}

/**
 * Test that the pass and fail frames contain the readyState and URL
 */
function testWaitForPageLoadStatusPass() {
  controller.open(TEST_DATA);
  controller.waitForPageLoad();
}

function testWaitForPageLoadStatusFail() {
  controller.open("https://www.addons.mozilla.org");
  controller.waitForPageLoad(100);
}
