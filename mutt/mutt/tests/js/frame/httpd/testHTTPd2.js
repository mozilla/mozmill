/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

Cu.import("resource://gre/modules/Services.jsm");


observer = {
  observe: function (subject, topic, data) {
    Services.obs.removeObserver(this, "http-on-examine-response", false);

    var channel = subject.QueryInterface(Ci.nsIHttpChannel);
    persisted.requestSucceeded = channel.requestSucceeded;
  }
};


var setupModule = function () {
  baseURL = collector.addHttpResource('../../_files/');
  testPages = [
    baseURL + 'link.html'
  ];

  controller = mozmill.getBrowserController();

  Services.obs.addObserver(observer, "http-on-examine-response", false);
}

var testHttpFailure = function() {
  controller.open(testPages[0]);
  controller.waitForPageLoad();

  controller.waitFor(function () {
    return persisted.requestSucceeded;
  }, "HTTPd.js does not respond with a Bad Request");
}


var teardownModule = function () {
  delete persisted.responseStatus;
}
