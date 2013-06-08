/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

Cu.import("resource://gre/modules/Services.jsm");

function testUserRestart() {
  var controller = mozmill.getBrowserController();
  controller.startUserShutdown(2000, true);
  controller.window.Application.restart();
}
