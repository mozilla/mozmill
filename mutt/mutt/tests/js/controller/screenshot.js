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

  //var mngb = findElement.ID(controller.tabs.activeTab, "mngb");
  //var gb_1 = findElement.ID(controller.tabs.activeTab, "gb_1");
  //var lga = findElement.ID(controller.tabs.activeTab, "lga");
  //var about = findElement.Link(controller.tabs.activeTab, "About Google");

  let obj = controller.screenShot(controller.window, "screen1", false, [content, project]);

  controller.open(obj.dataURL);
  controller.waitForPageLoad();
  controller.sleep(1000);
  
  //controller.screenShot(mngb, "screen2", true, [gb_1]);
  //controller.screenShot(lga, "screen3", true, [about]);
}

// screenshots of top chrome
var testChromeScreenshot = function() {
  return;
  var toolbox = findElement.ID(controller.window.document, "navigator-toolbox");
  var tabs = findElement.ID(controller.window.document, "tabbrowser-tabs");

  controller.screenShot(controller.window, "screen4", true, [tabs]);
  controller.screenShot(toolbox, "screen5", true, [tabs]);
}
