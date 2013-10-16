/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

const a = require("sub/moduleA");


function test() {
  expect.equal(a.subtract(10, 4), 6, "substract method calculates correctly.");
  expect.equal(a.add(2, 3), 5, "add method calculates correctly.");
  expect.equal(a.divide(6, 3), 2, "divide method calculates correctly.");
}
