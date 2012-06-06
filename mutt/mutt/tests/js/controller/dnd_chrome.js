/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var setupModule = function () {
  controller = mozmill.getBrowserController();
}

var test = function () {
  controller.open("chrome://mozmill/content/test/test.xul");
  controller.waitForPageLoad();

  let bar = new elementslib.ID(controller.window.document, "item1");
  let box = new elementslib.ID(controller.window.document, "item2");

  controller.dragToElement(bar, box);

  // successful drop makes bar disappear 
  controller.assertNodeNotExist(bar);
}