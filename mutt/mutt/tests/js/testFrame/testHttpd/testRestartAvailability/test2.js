/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

TEST_DATA = baseurl + "complex.html";

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();
}

function testMozhttpdServerWorksAfterShutdown(){
  controller.open(TEST_DATA);
  controller.waitForPageLoad();

  var element = new findElement.ID(controller.tabs.activeTab, "content");
  assert.ok(element.exists(), "Element has been found");
}
