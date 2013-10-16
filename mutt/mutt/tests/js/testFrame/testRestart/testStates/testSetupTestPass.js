/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

var state = 0;

// initialisation code that will only run once
// for example: setting the addons discovery pane URL to a local resource
function setupModule() {
  state = 2;
}

// initialisation code that will run for every test
// for example: initialising the controller or closing all tabs
function setupTest(aModule) {
  aModule.controller = mozmill.getBrowserController();
  state++;
}

function testOne() {
  assert.equal(state, 3, 'Ensure setupModule and setupTest ran before testOne');

  controller.restartApplication('testTwo');
}

function testTwo() {
  // this time setupModule is not run but setupTest is, so state is 1.
  assert.equal(state, 1, 'Ensure only setupTest ran before testTwo');
}

// teardown code that will run for every test
function teardownTest() {
  state--;
}

// teardown code that will only run once, at the very end
// for example: clearing user defined preferences
// Because it is only run after testTwo and teardowntest, state is 0
function teardownModule() {
  assert.equal(state, 0, 'Ensure that testTwo and teardownTest ran before teardownModule');
}
