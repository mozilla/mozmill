/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

const BASE_URL = collector.addHttpResource("../../data/");
const TEST_DATA = BASE_URL + "form.html";

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();
}

function test() {
  controller.open(TEST_DATA);
  controller.waitForPageLoad();

  let textbox = findElement.ID(controller.tabs.activeTab, "fname");
  let submit = findElement.ID(undefined, "submitButton");

  textbox.sendKeys("mozmill");
  submit.click();
  controller.waitForPageLoad();

  let urlbar = new findElement.ID(controller.window.document, "urlbar");
  let previousURL = urlbar.getNode().value;

  urlbar.keypress("a", {accelKey: true});
  urlbar.sendKeys(TEST_DATA);
  urlbar.keypress("VK_RETURN", {});
  controller.waitForPageLoad();

  expect.equal(urlbar.getNode().value, previousURL,
               "Loaded URL has to be equal to the initially loaded one.");
};
