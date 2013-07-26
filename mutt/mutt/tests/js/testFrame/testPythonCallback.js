/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

var setupTest = function () {
  controller = mozmill.getBrowserController();
}

var test = function () {
  mozmill.firePythonCallback("python_callback.py", "check",
                             [true], {state: "testOne"});

  // TODO: Bug 657825 - Python callbacks are fragile.
  // If an assertion happens the whole harness dies. So we can't run this test.
  //mozmill.firePythonCallback("python_callback.py", "check",
  //                           [false], {state: ""});
}
