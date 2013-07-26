/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

var setupTest = function () {
  controller = mozmill.getBrowserController();
}

// Bug 638989: mozmill tests should be able to trigger a runner reset
var test = function () {
  controller.restartApplication('testFinal');
}

var testFinal = function () {
  controller.stopApplication();
};
