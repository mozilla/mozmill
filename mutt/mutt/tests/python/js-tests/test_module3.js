/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

const TEST_FOLDER = collector.addHttpResource('../../js/_files/');


var setupModule = function () {
  controller = mozmill.getBrowserController();
  expect.pass("SetupModule passes");
}

var setupTest = function () {
  expect.fail("setupTest failed");
}

var test = function () {
  expect.pass("Test function is skipped.");
}

var teardownTest = function() {
  expect.pass("teardownTest passes");
}

var teardownModule = function() {
  expect.pass("teardownModule passes");
}
