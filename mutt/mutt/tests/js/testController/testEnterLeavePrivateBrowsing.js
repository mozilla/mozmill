/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

Cu.import("resource://gre/modules/Services.jsm");

const PREF_PB_NO_PROMPT = 'browser.privatebrowsing.dont_prompt_on_enter';

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();

  // Disable the notification when entering PB Mode
  aModule.prefBranch = Services.prefs.QueryInterface(Ci.nsIPrefBranch);
  aModule.prefBranch.setBoolPref(PREF_PB_NO_PROMPT, true);
}

function teardownModule(aModule) {
  aModule.prefBranch.clearUserPref(PREF_PB_NO_PROMPT);
}

function test() {
  privateBrowsing_start(controller);
  privateBrowsing_stop(controller);
  controller = mozmill.getBrowserController();
}

function privateBrowsing_start(aController) {
  aController.mainMenu.click("#privateBrowsingItem");

  // We have to wait until the transition has been finished
  mozmill.utils.waitFor(function () {
    var _pbTransitionItem = new elementslib.ID(aController.window.document, "Tools:PrivateBrowsing");
    return !_pbTransitionItem.getNode().hasAttribute('disabled');
  }, "Transition for Private Browsing mode has been finished.", undefined, undefined, this);
  mozmill.utils.waitFor(function () {
    return _pbs.privateBrowsingEnabled === true;
  }, "Private Browsing state has been changed. Expected 'true'", undefined, undefined, this);
}

function privateBrowsing_stop(aController) {
  // Set up an observer and a flag so we get notified when we exited PB
  var finishedStateFlag = false;
  var observer = {
    observe: function (aSubject, aTopic, aData) {
      finishedStateFlag = true;
    }
  }

  try {
    // Using this notification because the change where notifications became
    // independent of non-deterministic factors (e.g garbage collection) from
    // bug 804653 did not land on ESR17
    Services.obs.addObserver(observer, "private-browsing-transition-complete", false);
    aController.mainMenu.click("#privateBrowsingItem");
    mozmill.utils.waitFor(function () {
      return finishedStateFlag;
    }, "Private browsing was exited");
  }
  finally {
    Services.obs.removeObserver(observer, "private-browsing-transition-complete");
  }
}

// Bug 915554
// Support for the old Private Browsing Mode (eg. ESR17)
// TODO: remove mutt test once ESR17 is no longer supported
try {
  var _pbs = Cc["@mozilla.org/privatebrowsing;1"].getService(Ci.nsIPrivateBrowsingService);
}
catch (error) {
  setupModule.__force_skip__ = "Bug 915554 - This test needs the old PB Mode available. " +
                               "ESR17 is the last supported version"
  teardownModule.__force_skip__ = "Bug 915554 - This test needs the old PB Mode available " +
                                  "ESR17 is the last supported version"
}
