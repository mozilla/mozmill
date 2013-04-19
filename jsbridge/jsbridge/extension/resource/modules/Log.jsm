/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

var EXPORTED_SYMBOLS = ["Log"];


const Cu = Components.utils;


// Import global modules
Cu.import("resource://gre/modules/Services.jsm");


// Constants for preferences names
const PREF_JSBRIDGE_LOG = "extensions.jsbridge.log";

const LOGGING = Services.prefs.prefHasUserValue(PREF_JSBRIDGE_LOG) &&
                Services.prefs.getBoolPref(PREF_JSBRIDGE_LOG);


var Log = {

  /**
   * Dump log message to stdout.
   *
   * @param {String} aTopic
   *        Topic of the message to be logged
   * @param {String} aMessage
   *        Message to be logged
   */
  dump: function (aTopic, aMessage) {
    if (LOGGING) {
      dump("* " + aTopic + ": '" + aMessage + "'\n");
    }
  }
}
