/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var setupModule = function(module) {
  controller = mozmill.getBrowserController();
  assert.pass("SetupModule passes");
}

var setupTest = function() {
  assert.pass("setupTest passes");
}

var testTestStep = function() {
  assert.pass("test Passes");
  controller.open("http://www.mozilla.org");
}

var teardownTest = function() {
  assert.pass("teardownTest passes");
}

var teardownModule = function() {
  assert.pass("teardownModule passes");
}
