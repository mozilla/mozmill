/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

function setupModule() {
  controller = mozmill.getBrowserController();
  expect.pass("SetupModule passes");
}

function setupTest() {
  expect.pass("setupTest passes");
}

function test() {
  expect.fail("test fails");
}

function teardownTest() {
  expect.pass("teardownTest passes");
}

function teardownModule() {
  expect.pass("teardownModule passes");
}
