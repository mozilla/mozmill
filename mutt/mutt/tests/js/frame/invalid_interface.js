/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var setupModule = function () {
  controller = mozmill.getBrowserController();
}

// Bug 627422: Invalid interface names causes an empty error object (no message or stack)
var test = function () {
  expect.doesNotThrow(function () {
    let cm = Cc["@mozilla.org/cookiemanager;1"]
             .getService(Ci.nsICookieManager2);
  }, "Error", "Valid interface should not raise an error");

  let exception;
  try {
    let importer = Cc["@mozilla.org/browser/places/import-export-service;1"]
                   .getService(Ci.nsIPlacesImportExportServi);
  } catch (e) {
    exception = e;
  }

  assert.ok(exception, "An exception has been thrown for an invalid interface.");
  expect.notEqual(exception.message, "", "Exception message is not empty.");
  expect.notEqual(exception.location, "", "Exception location is not empty.");
}

