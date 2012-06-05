/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const TEST_FOLDER = collector.addHttpResource('../_files/');


var setupModule = function () {
  controller = mozmill.getBrowserController();

  urlbar = new elementslib.ID(controller.window.document, "urlbar");
}

var test = function () {
  controller.open(TEST_FOLDER + "link.html");
  controller.waitForPageLoad();

  let link = new elementslib.ID(controller.tabs.activeTab, "link");
  controller.waitForElement(link);
  controller.dragToElement(link, urlbar, 100, 20);
  controller.waitForPageLoad();

  let div = new elementslib.ID(controller.tabs.activeTab, "test-div");
  controller.assertNode(div);
}
