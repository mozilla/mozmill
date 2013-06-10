/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

var testNoLeakFromA = function () {
  expect.throws(function () {
    var local = globalA;
  }, "ReferenceError", "Global variable from a different script is not accessible.");
};

var testNoLeakFromFrameJS = function () {
  expect.throws(function () {
    var local = mozelement;
  }, "ReferenceError", "Global variable from frame.js is not accessible.");
};
