/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var gDelay = 500;

var setupModule = function(module) {
  controller = mozmill.getBrowserController();
}

var checkKeypressFunction = function(element) {
  element.getNode().value = "";

  // controller.keypress should not focus element when window is given as element
  controller.keypress(null, "F", {});
  controller.sleep(gDelay);
  controller.assertValue(element, "");

  // controller.keypress should focus the element when the element itself is given as parameter
  controller.keypress(element, "M", {});
  controller.sleep(gDelay);
  controller.assertValue(element, "M");

  // controller.keypress should not clear formerly entered text
  controller.keypress(element, "F", {});
  controller.sleep(gDelay);
  controller.assertValue(element, "MF");
}

var checkTypeFunction = function(element) {
  element.getNode().value = "";

  // controller.type should not focus element when window is given as element
  controller.type(null, "Firefox");
  controller.sleep(gDelay);
  controller.assertValue(element, "");

  // controller.type should focus the element when the element itself is given as parameter
  controller.type(element, "Mozilla");
  controller.sleep(gDelay);
  controller.assertValue(element, "Mozilla");

  // controller.type should not clear formerly entered text
  controller.type(element, " Firefox");
  controller.sleep(gDelay);
  controller.assertValue(element, "Mozilla Firefox");
}

var testContentTextboxFocus = function() {
  controller.open("http://www.mozilla.org");
  controller.waitForPageLoad(controller.tabs.activeTab);

  var searchField = new elementslib.ID(controller.tabs.activeTab, "q");
  controller.waitForElement(searchField, 5000);
  controller.sleep(gDelay);

  checkKeypressFunction(searchField);
  checkTypeFunction(searchField);
}

var testChromeTextboxFocus = function() {
  var searchBar = new elementslib.ID(controller.window.document, "searchbar");

  checkKeypressFunction(searchBar);

  // Move focus to the location bar to blur the search bar
  controller.keypress(null, "l", {accelKey: true});
  checkTypeFunction(searchBar);
}