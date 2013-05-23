/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Bug 767332
 * If tests use a page from the local httpd.js server more than once
 * successive tests will fail because of an inappropriate shutdown of the server
 **/

const BASE_URL = collector.addHttpResource("../../_files/");
const TEST_DATA = [
  BASE_URL + "complex.html",
  BASE_URL + "singlediv.html"
];

var setupModule = function () {
  controller = mozmill.getBrowserController();
}

var testOpenLocalPages = function () {
  TEST_DATA.forEach(function (aPage) {
    controller.open(aPage);
    controller.waitForPageLoad();

    controller.sleep(500);
  });

  controller.open(TEST_DATA[0]);
  controller.waitForPageLoad();
}
