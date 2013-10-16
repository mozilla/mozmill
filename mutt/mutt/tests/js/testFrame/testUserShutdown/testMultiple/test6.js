/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();

  aModule.controller.startUserShutdown(1000, false);
  aModule.controller.mainMenu.click("#menu_FileQuitItem");
}

function setupTest() {
  assert.fail("setupTest should not have been run.");
}

function testSkip() {
  assert.fail("The test should not have been run.");
}

function teardownTest() {
  assert.fail("teardownTest should not have been run.");
}

function teardownModule() {
  assert.fail("teardownModule should not have been run.");
}
