/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const TEST_FOLDER = collector.addHttpResource('../_files/');
const TEST_PAGE = TEST_FOLDER + "form.html";

var setupModule = function () {
  controller = mozmill.getBrowserController();
}

var test = function () {
  controller.open(TEST_PAGE);
  controller.waitForPageLoad();

  let textbox = findElement.ID(controller.tabs.activeTab, "fname");
  let submit = findElement.ID(undefined, "submitButton");

  textbox.sendKeys("mozmill");
  controller.click(submit);
  controller.waitForPageLoad();

  let urlbar = new findElement.ID(controller.window.document, "urlbar");
  let previousURL = urlbar.getNode().value;

  urlbar.keypress("a", {accelKey: true});
  urlbar.sendKeys(TEST_PAGE);
  urlbar.keypress("VK_RETURN", {});
  controller.waitForPageLoad();

  expect.equal(urlbar.getNode().value, previousURL,
               "Loaded URL has to be equal to the initially loaded one.");
};
