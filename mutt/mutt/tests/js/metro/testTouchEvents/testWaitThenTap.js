/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const TEST_DATA = baseurl + "form.html";

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();
}

function testWaitThenTap() {
  controller.open(TEST_DATA);
  controller.waitForPageLoad();

  let lname = new findElement.ID(controller.tabs.activeTab, "lname");

  expect.doesNotThrow(function () {
    lname.waitThenTap(null, null, null, null, {type: "focus"});
  }, "Error", "tap() on a text field raises a focus event.");

  expect.throws(function () {
    lname.waitThenTap(null, null, null, null, {type: "keypress"});
  }, "Error", "tap() on a text field does not raise a keypress event.");
}
