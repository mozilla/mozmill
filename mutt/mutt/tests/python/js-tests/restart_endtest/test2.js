/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

Cu.import("resource://gre/modules/Services.jsm");


function testRestart() {
  try {
    throw Error("A failure which is not caught.");
  } finally {
    var controller = mozmill.getBrowserController();
    controller.restartApplication('testShutdown');
  }
}

function testShutdown() {
  try {
    throw Error("A failure which is not caught.");
  } finally {
    var controller = mozmill.getBrowserController();
    controller.stopApplication();
  }
}
