/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

const BASE_URL = collector.addHttpResource("../../js/_files/");
const TEST_DATA = BASE_URL + "singlediv.html";

var setupModule = function () {
  controller = mozmill.getBrowserController();
  expect.pass("SetupModule passes");
}

var setupTest = function () {
  expect.pass("setupTest passes");
}

var test = function () {
  controller.open(TEST_DATA);
  controller.waitForPageLoad();
}

var teardownTest = function() {
  expect.pass("teardownTest passes");
}

var teardownModule = function() {
  expect.pass("teardownModule passes");
}
