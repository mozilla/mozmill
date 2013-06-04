/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

var utils = {}; Cu.import('resource://mozmill/stdlib/utils.js', utils);

// this timeout should be more than |jsbridge_timeout|
var gSecondsToWait = 8;

/**
 * This test runs for |gSecondsToWait| second
 * Using short sleeps avoids Application Disconnect exceptions
 */
var testSleep = function () {
  for (var i = 0; i < gSecondsToWait; i++){
    utils.sleep(1000);
  }
}

/**
 * This test runs about |gSecondsToWait| second
 * Using short waits avoids Application Disconnect exceptions
 */
var testWaitFor = function () {
  for (var i = 0; i < gSecondsToWait; i++){
    var step = 0;
    utils.waitFor(function () {
      step++;
      return step > 1;
    }, undefined, 2000, 1000);
  }
}
