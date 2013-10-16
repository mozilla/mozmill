/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

function setupTest(aModule) {
  aModule.controller = mozmill.getBrowserController();
}

// Bug 638989: mozmill tests should be able to trigger a runner reset
function test() {
  controller.restartApplication('testFinal');
}

function testFinal() {
  controller.stopApplication();
};
