/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

Cu.import("resource://gre/modules/Services.jsm");


function setupModule() {
  persisted.state = {
    finished: false,
    next: "",
    restart: false,
    user: false,
  };
}

function setupTest(aModule) {
  aModule.controller = mozmill.getBrowserController();
}

function teardownTest(aModule) {
  if (persisted.state.finished) {
    aModule.controller.stopApplication(true);
  }

  if (persisted.state.restart) {
    if (!persisted.state.user) {
      aModule.controller.restartApplication(persisted.state.next);
    }
    else {
      aModule.controller.startUserShutdown(2000, true, persisted.state.next);

      var cancelQuit = Cc["@mozilla.org/supports-PRBool;1"].
                       createInstance(Ci.nsISupportsPRBool);
      Services.obs.notifyObservers(cancelQuit, "quit-application-requested", null);

      Services.startup.quit(Ci.nsIAppStartup.eAttemptQuit | Ci.nsIAppStartup.eRestart);
    }
  }
}

function testFailureWithoutRestart() {
  assert.fail("A failing assertion without restarting the application has to be counted.");
}

function testFailureWithRestart() {
  // Bug 886360
  // User shutdown tests are currently not supported
  // persisted.state.next = "testFailureWithUserRestart";
  persisted.state.next = "testFailureWithShutdown";
  persisted.state.restart = true;

  assert.fail("A failing assertion with restarting the application has to be counted.");
}

function testFailureWithUserRestart() {
  persisted.state.next = "testFailureWithShutdown";
  persisted.state.restart = true;
  persisted.state.user = true;

  assert.fail("A failing assertion with restarting the application has to be counted.");
}

function testFailureWithShutdown() {
  persisted.state.finished = true;

  assert.fail("A failing assertion with stopping the application has to be counted.");
}
