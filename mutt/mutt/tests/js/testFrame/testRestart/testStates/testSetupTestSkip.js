/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

var state = 0;
var iteration = 0;

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();
  state = 1;
}

function setupTest() {
  // if setupTest fails then testOne should be skipped
  assert.fail('Ensure failure to see that testOne is skipped');
}

// Will be skipped due to setupTest failure
function testOne() {
  state += 2;
  controller.restartApplication('testTwo');
}

// Will be skipped due to setupTest failure
function testTwo() {
  state += 4
  assert.pass('testTwo should not be run');
}

function teardownTest() {
  assert.equal(1, state - iteration,
               'Only setupModule ran prior to teardownTest so state is 1');
  state += 1;
  iteration++;
}

function teardownModule() {
  assert.equal(state, 3, 'Ensure no tests ran but teardownTest ran due to fail in setupTest');
}
