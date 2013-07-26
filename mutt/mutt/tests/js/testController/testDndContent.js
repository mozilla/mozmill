/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

const TEST_DATA = "chrome://mozmill/content/test/test.html";

var setupModule = function () {
  controller = mozmill.getBrowserController();
}

var test = function () {
  controller.open(TEST_DATA);
  controller.waitForPageLoad();

  let bar = new elementslib.ID(controller.window.document, "item1");
  let box = new elementslib.ID(controller.window.document, "item2");

  bar.dragToElement(box);

  // successful drop makes bar disappear
  expect.ok(!bar.exists(), "Element 'bar' no longer exists");
}
