/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const TEST_FOLDER = collector.addHttpResource('../_files/');


var setupModule = function () {
  controller = mozmill.getBrowserController();
}

// screenshots of content window
var testContentScreenshot = function () {
  controller.open(TEST_FOLDER + "complex.html");
  controller.waitForPageLoad();

  let content = findElement.ID(controller.tabs.activeTab, "content");
  let project = findElement.ID(controller.tabs.activeTab, "project");

  controller.screenShot(controller.window, "screen1", false, [content, project]);
}

// screenshots of top chrome
var testChromeScreenshot = function() {
  var toolbox = findElement.ID(controller.window.document, "navigator-toolbox");
  var tabs = findElement.ID(controller.window.document, "tabbrowser-tabs");

  controller.screenShot(controller.window, "screen4", true, [tabs]);
  controller.screenShot(toolbox, "screen5", true, [tabs]);
}
