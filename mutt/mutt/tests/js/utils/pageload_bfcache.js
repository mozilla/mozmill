/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const TEST_FOLDER = collector.addHttpResource('../_files/');


var setupModule = function () {
  controller = mozmill.getBrowserController();
}

var testWaitForPageLoad = function()  {
  controller.open(TEST_FOLDER + "link.html");
  controller.waitForPageLoad();

  var link = findElement.ID(controller.tabs.activeTab, "link");
  link.click();
  controller.waitForPageLoad();

  controller.goBack();
  controller.waitForPageLoad();

  link = findElement.ID(controller.tabs.activeTab, "link");
  domains.click();
}
