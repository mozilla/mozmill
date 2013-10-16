/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

function setupTest(aModule) {
  aModule.controller = mozmill.getBrowserController();
}

function testOne() {
  persisted.data = {foo: "bar"};
  controller.restartApplication('testTwo');
}

function testTwo() {
  expect.ok(persisted.data, "User-defined object is present");
  expect.equal(persisted.data.foo, "bar", "User-defined data is still set.");

  delete persisted.data;
  controller.restartApplication('testThree');
}

function testThree() {
  expect.ok(!persisted.data, "User-defined object has been removed.");
}

function teardownModule() {
  delete persisted.data;
}
