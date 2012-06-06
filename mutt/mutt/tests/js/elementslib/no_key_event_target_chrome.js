/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var setupModule = function () {
  controller = mozmill.getBrowserController();
}

// Bug 677364:
// Fix controller keyboard methods to allow a null parameter for the target element
var test = function () {
  let urlbar = new findElement.ID(controller.window.document, "urlbar");

  // Focus the location bar first
  controller.click(urlbar);

  controller.keypress(null, "t", { });
  expect.equal(urlbar.getNode().value, "t", "keypress added letter to location bar.");
  urlbar.getNode().value = "";

  controller.type(null, "Firefox");
  expect.equal(urlbar.getNode().value, "Firefox", "sendKeys added letters to location bar.");
}
