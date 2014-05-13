/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();
}

function testWaitFor() {
  controller.keypress(null, "q", {accelKey: true});

  assert.waitFor(() => false,
                 "Wait for shutdown", persisted.waitTime);
}
