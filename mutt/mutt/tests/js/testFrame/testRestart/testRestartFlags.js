/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

// Bug 893026
// Ensure that we correctly restart the application by the flags specified
// Note: As of now this only works on OS X because no other optional flags exist.

Cu.import("resource://gre/modules/Services.jsm");

function setupTest(aTest) {
  aTest.controller = mozmill.getBrowserController();
}

function testRestartIn32Bit() {
  expect.equal(Services.appinfo.XPCOMABI, "x86_64-gcc3",
               "By default the application launches in 64bit mode");

  controller.restartApplication('testRestartedIn32Bit', Ci.nsIAppStartup.eRestarti386);
}

function testRestartedIn32Bit() {
  expect.equal(Services.appinfo.XPCOMABI, "x86-gcc3",
               "Successfully restarted in 32bit mode after requesting it");

  controller.restartApplication('testRestartedIn64Bit', Ci.nsIAppStartup.eRestartx86_64);
}

function testRestartedIn64Bit() {
  expect.equal(Services.appinfo.XPCOMABI, "x86_64-gcc3",
               "Successfully restarted in 64bit mode after requesting it");
}
