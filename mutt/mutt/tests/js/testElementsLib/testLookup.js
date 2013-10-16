/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();
}

function testLookupExpression() {
  var expression = '/id("main-window")';
  var element = new elementslib.Lookup(controller.window.document, expression);
  assert.equal(element.expression, expression,
               "The expression has been exposed by the Lookup method");
}

function testElementNotExists() {
  var mainWindow = new elementslib.Lookup(controller.window.document,
                                          '/id("main-windo")');
  expect.ok(!mainWindow.exists(),
            "Element with incorrect id does not exist");

  var popupSet = new elementslib.Lookup(controller.window.document,
                                        '/id("main-windo")/id("mainPopupSet")');
  expect.ok(!popupSet.exists(),
            "Element with incorrect id for parent node does not exist");

  popupSet = new elementslib.Lookup(controller.window.document,
                                    '/id("main-window")/id("mainPopupSe")');
  expect.ok(!popupSet.exists(),
            "Element with incorrect id for child node does not exist");
}

function testInvalidLookupExpression() {
  expect.throws(function () {
    var element = new elementslib.Lookup(controller.window.document, '/id(main-window)');
  }, "SyntaxError", "Invalid lookup expression failed");
}
