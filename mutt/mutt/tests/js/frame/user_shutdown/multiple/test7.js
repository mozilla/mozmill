/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

var setupModule = function () {
  controller = mozmill.getBrowserController();
}

// This test should fail
var testRestartAfterTimeout = function () {
  controller.startUserShutdown(1000, true);
  controller.sleep(2000);
  controller.window.Application.restart();
}
