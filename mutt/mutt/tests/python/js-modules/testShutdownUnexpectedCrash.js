/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

Cu.import("resource://crashme/modules/Crasher.jsm");

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();
}

function testUnexpectedCrash() {
  Crasher.crash(Crasher.CRASH_NULL_POINTER_DEREF);

  controller.sleep(10000);
}
