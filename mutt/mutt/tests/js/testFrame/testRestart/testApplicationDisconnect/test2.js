/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

// Bug 764442
// Application disconnect errors because of invalid frame objects
// if a test file restarts the browser

function setupTest(aModule) {
  aModule.controller = mozmill.getBrowserController();
}

function testOne() {
}
