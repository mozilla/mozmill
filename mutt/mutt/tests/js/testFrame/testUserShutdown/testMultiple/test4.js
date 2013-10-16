/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();
}

// This test should fail (Restart expected but none detected before end of test)
function testNoExpectedRestartByEndTest() {
  controller.startUserShutdown(1000, true);
  controller.sleep(100);
}
