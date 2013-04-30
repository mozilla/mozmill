/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

var state = 0;

function setupModule() {
  controller = mozmill.getBrowserController();
  state = 1;
}

function setupTest() {
  // if setupTest fails then testOne should be skipped
  assert.fail('Ensure failure to see that testOne is skipped');
}

// Will be skipped due to setupTest failure
function testOne() {
  state++;
  controller.restartApplication('testTwo');
}

function testTwo() {
  // second test - won't be run because testOne is skipped.
  // adding it as a passing test because this test expects to fail...
  // have to turn your head around on this one.
  assert.pass('testTwo should not be run');
}

function teardownTest() {
  assert.equal(state, 1, 'Only setupModule ran prior to teardownTest so state is 1');
  state = 3;
}

function teardownModule() {
  assert.equal(state, 3, 'Ensure no tests ran but teardownTest ran due to fail in setupTest');
}
