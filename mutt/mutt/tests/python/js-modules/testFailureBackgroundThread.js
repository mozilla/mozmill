/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

var failure = false;

var setupModule = function (aModule) {
  aModule.controller = mozmill.getBrowserController();
}

var testExceptionBackgroundThread = function () {
  var timer = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);

  var event = {
    notify: function () {
      try {
        // Throws an error because interval is not defined
        timer.initWithCallback(this, interval, Ci.nsITimer.TYPE_ONE_SHOT);

        assert.fail("We should not have reached this code.");
      }
      finally {
        failure = true;
      }
    }
  };

  timer.initWithCallback(event, 100, Ci.nsITimer.TYPE_ONE_SHOT);

  assert.waitFor(function () {
    return failure;
  }, "Exception in background thread has been caught", 1000);
}
