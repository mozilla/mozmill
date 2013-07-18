/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

Cu.import("resource://gre/modules/Services.jsm");


function setupModule() {
  persisted.state = {
    index: 0
  };
}

function setupTest(aModule) {
  aModule.controller = mozmill.getBrowserController();

  testSkipWithoutRestart.__force_skip__ = "A skipped test without restarting the application has to be counted.";
  testSkipWithRestart.__force_skip__ = "A skipped test with restarting the application has to be counted.";
  testSkipWithUserRestart.__force_skip__ = "A skipped test with restarting the application has to be counted.";
  testSkipWithShutdown.__force_skip__ = "A skipped test with stopping the application has to be counted.";
}

function teardownTest(aModule) {
  switch (persisted.state.index++) {
    case 1:
      aModule.controller.restartApplication('testSkipWithUserRestart');

      break;
    case 2:
      aModule.controller.startUserShutdown(2000, true, 'testSkipWithShutdown');

      var cancelQuit = Cc["@mozilla.org/supports-PRBool;1"].
                       createInstance(Ci.nsISupportsPRBool);
      Services.obs.notifyObservers(cancelQuit, "quit-application-requested", null);

      Services.startup.quit(Ci.nsIAppStartup.eAttemptQuit | Ci.nsIAppStartup.eRestart);

      break;
    case 3:
      aModule.controller.stopApplication(true);

      break;
  }
}

function testSkipWithoutRestart() {
}

function testSkipWithRestart() {
}

function testSkipWithUserRestart() {
}

function testSkipWithShutdown() {
}
