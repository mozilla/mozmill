/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

Cu.import("resource://gre/modules/Services.jsm");

var observer = {
  observe: function (aSubject, aTopic, aData) {
    Services.obs.removeObserver(observer, "quit-application", false);
    persisted.restarted = true;
  }
}

var setupTest = function () {
  controller = mozmill.getBrowserController();

  persisted.restarted = false;
  Services.obs.addObserver(observer, "quit-application", false);
}

// Do not restart the application even by telling so
var testFailingRestart = function () {
  controller.startUserShutdown(500, true);
  controller.sleep(2000);
}
