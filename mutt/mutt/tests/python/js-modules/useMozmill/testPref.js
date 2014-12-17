/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

Cu.import("resource://gre/modules/Services.jsm");


function testPref() {
  var value = Services.prefs.getIntPref("abc");
  assert.equal(value, 123, "The pref 'abc' matches the specified value.");
}
