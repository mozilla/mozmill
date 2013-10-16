/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();
};

/**
 * Bug 584470
 * Global timeout should allow to proceed the next test instead of killing
 * the complete test-run
 */
function test() {
  controller.sleep(120000);
};
