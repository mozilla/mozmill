/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

var EXPORTED_SYMBOLS = ['escapeRegEx', 'trim', 'vslice'];

var arrays = {}; Components.utils.import('resource://mozmill/stdlib/arrays.js', arrays);

var sRE = /[-[\]{}()*+?.,\\^$|#\s]/g;

/**
 * Helper function to use when including externally generated strings
 * in a regular expression.
 *
 * @param {string} aString text to be escaped.
 *
 * @returns {string} New string with metacharacters escaped.
 */

function escapeRegEx(aString) {
  return aString.replace(sRE, "\\$&");
}

function trim(str) {
  return (str.replace(/^[\s\xA0]+/, "").replace(/[\s\xA0]+$/, ""));
}

function vslice(str, svalue, evalue) {
  var sindex = arrays.indexOf(str, svalue);
  var eindex = arrays.rindexOf(str, evalue);
  return str.slice(sindex + 1, eindex);
}
