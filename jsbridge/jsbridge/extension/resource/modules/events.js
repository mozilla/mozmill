/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

var EXPORTED_SYMBOLS = ["backchannels", "fireEvent", "addBackChannel"];

var backchannels = [];

var fireEvent = function (name, obj) {
  for each(var backchannel in backchannels) {
    backchannel.session.encodeOut({'eventType': name,
                                   'result':obj});
  }
};

var addBackChannel = function (backchannel) {
  backchannels.push(backchannel);
};
