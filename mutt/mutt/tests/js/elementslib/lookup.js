/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

var setupModule = function () {
  controller = mozmill.getBrowserController();
}

var testLookupExpression = function () {
  var expression = '/id("main-window")';
  var element = new elementslib.Lookup(controller.window.document, expression);
  assert.equal(element.expression, expression,
               "The expression has been exposed by the Lookup method");
}
