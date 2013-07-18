/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

Cu.import("resource://gre/modules/Services.jsm");

const STATES = [
  "testFirst",
  "testSecond",
  "testThird"
];


function setupModule(aModule) {
  persisted.seen_states = ['setupModule'];

  persisted.state = {
    index: 0,
    finished: false
  };
}

function setupTest(aModule) {
  persisted.seen_states.push('setupTest');

  aModule.controller = mozmill.getBrowserController();
}

function teardownTest(aModule) {
  persisted.seen_states.push('teardownTest');

  if (!persisted.state.finished) {
    aModule.controller.restartApplication(STATES[persisted.state.index]);
  } else {
    aModule.controller.stopApplication();
  }
}

function teardownModule(aModule) {
  persisted.seen_states.push('teardownModule');
}

function testFirst() {
  persisted.seen_states.push('testFirst');
  persisted.state.index = 2;
}

function testSecond() {
  persisted.seen_states.push('testSecond');
  persisted.state.finished = true;
}

function testThird() {
  persisted.seen_states.push('testThird');
  persisted.state.index = 1
}

function testForth() {
  assert.fail("This test should not be executed");
}
