/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Bug 767332
 * If tests use a page from the local httpd.js server more than once
 * successive tests will fail because of an inappropriate shutdown of the server
 **/

var setupModule = function () {
  baseURL = collector.addHttpResource('../../_files/');
  testPages = [
    baseURL + 'complex.html',
    baseURL + 'singlediv.html'
  ];

  controller = mozmill.getBrowserController();
}

var testOpenLocalPages = function () {
  testPages.forEach(function (aPage) {
    controller.open(aPage);
    controller.waitForPageLoad();

    controller.sleep(500);
  });

  controller.open(testPages[0]);
  controller.waitForPageLoad();
}
