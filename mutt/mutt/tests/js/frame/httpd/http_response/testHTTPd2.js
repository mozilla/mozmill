/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

Cu.import("resource://gre/modules/Services.jsm");

const BASE_URL = collector.addHttpResource("../../../_files/");
const TEST_DATA = BASE_URL + "link.html";

observer = {
  observe: function (subject, topic, data) {
    Services.obs.removeObserver(this, "http-on-examine-response", false);

    var channel = subject.QueryInterface(Ci.nsIHttpChannel);
    persisted.requestSucceeded = channel.requestSucceeded;
  }
};


var setupModule = function () {
  controller = mozmill.getBrowserController();
  Services.obs.addObserver(observer, "http-on-examine-response", false);
}

var testHttpFailure = function() {
  controller.open(TEST_DATA);
  controller.waitForPageLoad();

  controller.waitFor(function () {
    return persisted.requestSucceeded;
  }, "HTTPd.js does not respond with a Bad Request");
}


var teardownModule = function () {
  delete persisted.responseStatus;
}
