/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

const TEST_DATA = [
  "http://mozqa.com/data",
  "http://mozqa.com/data/firefox"
];

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();
}

/**
 * Validate tab manipulation under the Metro interface
 */
function testMetroTabs() {
  controller.open(TEST_DATA[0]);
  controller.waitForPageLoad();

  controller.keypress(null, "t", { accelKey: true });
  assert.waitFor(function () {
    return controller.tabs.length == 2;
  }, "A second tab has been opened");

  expect.equal(controller.tabs.activeTabIndex, 1,
               "The second tab is selected");
  expect.equal(controller.tabs.getTab(1), controller.tabs.activeTab,
               "The second tab is the active tab");

  controller.open(TEST_DATA[1]);
  controller.waitForPageLoad();

  controller.tabs.selectTabIndex(0);

  expect.equal(controller.tabs.activeTabIndex, 0,
               "The first tab is selected");
  expect.equal(controller.tabs.getTab(0), controller.tabs.activeTab,
               "The first tab is the active tab");

  controller.keypress(null, "w", { accelKey: true });

  assert.waitFor(function () {
    return controller.tabs.length == 1;
  }, "The second tab has been closed");
}
