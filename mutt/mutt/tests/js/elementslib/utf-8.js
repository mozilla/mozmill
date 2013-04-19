/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

const TEST_FOLDER = collector.addHttpResource('../_files/');

const TEST_STRINGS = [
  "tanowiących",
  "組織概要"
];

var setupModule = function () {
  controller = mozmill.getBrowserController();
};

var test = function () {
  controller.open(TEST_FOLDER + "form.html");
  controller.waitForPageLoad();

  var textbox = new elementslib.ID(controller.tabs.activeTab, "fname");

  TEST_STRINGS.forEach(function (text) {
    controller.type(textbox, text);
    expect.equal(textbox.getNode().value, text,
                 "Expected UTF-8 string is present.");
    textbox.getNode().value = "";
  });
}
