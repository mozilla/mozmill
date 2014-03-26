/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

Cu.import("resource://gre/modules/Services.jsm");

var observer = {
  observe: function observer_observe(aSubject, aTopic, aData) {
    Services.obs.removeObserver(observer, "quit-application-requested", false);
    persisted.restarted = true;
  }
}

function setupTest(aModule) {
  aModule.controller = mozmill.getBrowserController();

  persisted.restarted = false;
  Services.obs.addObserver(observer, "quit-application-requested", false);
}

// Do not restart the application even by telling so
function testFailingRestart() {
  controller.startUserShutdown(500, true);
  controller.sleep(2000);
}
