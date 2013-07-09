/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Bug 881657
 * Use a global instance of httpd.js and ensure it persists over sessions
 **/

var http_server_available = false;

try {
  collector.addHttpResource("../../_files/");
  http_server_available = true;
}
catch (ex) {
}

function setupTest(aTest) {
  aTest.controller = mozmill.getBrowserController();
}

function testSession1() {
  expect.ok(http_server_available,
            'Local HTTP server is available');

  controller.restartApplication("testSession2");
}

function testSession2() {
  expect.ok(http_server_available,
            'Local HTTP server is available after a restart of the application');
}
