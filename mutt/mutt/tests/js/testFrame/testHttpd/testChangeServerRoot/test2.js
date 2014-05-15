/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const TEST_DATA = baseurl + "data2.html"

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();
}

function testServerRootChange2() {
  controller.open(TEST_DATA);
  controller.waitForPageLoad();

  var el = findElement.ID(controller.window.document, "data");
  assert.equal(el.getNode().textContent, "test2",
               "Correct server-root has been delivered");
}
