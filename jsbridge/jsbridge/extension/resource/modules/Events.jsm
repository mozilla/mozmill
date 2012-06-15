/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

var EXPORTED_SYMBOLS = ["Events"];


const Cu = Components.utils;


// Include local modules
Cu.import("resource://jsbridge/modules/Log.jsm");


var Events = {
  backChannels: [],

  addBackChannel: function (aBackChannel) {
    Log.dump("Add backchannel", JSON.stringify(aBackChannel));

    Events.backChannels.push(aBackChannel);
  },

  fireEvent: function (aName, aObj) {
    Log.dump("Fire event", aName);

    Events.backChannels.forEach(function (aBackChannel) {
      aBackChannel.session.encodeOut({
          'eventType': aName,
          'result': aObj}
      );
    });
  }
};
