/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

const b = require("../module_b");

var substract = exports.subtract = function (x, y) {
  return x - y;
}


exports.divide = require("../module_b").divide;
exports.add = require("../module_c").add;
