/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

var setupTest = function () {
  controller = mozmill.getBrowserController();
}

var testRestartBeforeTimeout = function () {
  controller.startUserShutdown(2000, true);
  controller.sleep(1000);
  controller.window.Application.restart();
}
