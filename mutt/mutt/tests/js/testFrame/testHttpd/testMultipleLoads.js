/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Bug 767332
 * If tests use a page from the local httpd.js server more than once,
 * successive tests will fail because the server does not respond.
 **/

Cu.import("resource://gre/modules/Services.jsm");

const BASE_URL = collector.addHttpResource("../../data/");
const TEST_DATA = [
  BASE_URL + "complex.html",
  BASE_URL + "form.html",
  BASE_URL + "singlediv.html"
];


function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();

  // Clear all caches so formerly loaded pages aren't stored yet
  Services.cache.evictEntries(Ci.nsICache.STORE_ANYWHERE);
}


function testLoadFromDifferentSources() {
  // Load all pages once from httpd.js
  [0, 1, 2].forEach(function (aIndex) {
    loadPage(TEST_DATA[aIndex], "http-on-examine-response");
  });

  // Load the first page again which will be served from the cache
  loadPage(TEST_DATA[0], "http-on-examine-cached-response");

  // Disable the cache so we can ensure that httpd.js can successfully load
  // a local page more than one time
  Services.prefs.setBoolPref("browser.cache.disk.enable", false);
  Services.prefs.setBoolPref("browser.cache.memory.enable", false);

  loadPage(TEST_DATA[0], "http-on-examine-response");
}


function loadPage(aUrl, aResponseType) {
  var request = { succeeded: false };

  observer = {
    observe: function (aSubject, aTopic, aData) {
      var channel = aSubject.QueryInterface(Ci.nsIHttpChannel);

      switch (aTopic) {
        case "http-on-modify-request":
          Services.obs.removeObserver(observer, "http-on-modify-request", false);
          break;

        case "http-on-examine-response":
        case "http-on-examine-cached-response":
        case "http-on-examine-merged-response":
          if (channel.originalURI.spec === aUrl) {
            Services.obs.removeObserver(observer, "http-on-examine-response", false);
            Services.obs.removeObserver(observer, "http-on-examine-cached-response", false);
            Services.obs.removeObserver(observer, "http-on-examine-merged-response", false);

            request.responseStatus = channel.responseStatus;
            request.responseType = aTopic;
            request.succeeded = channel.requestSucceeded;
          }
      }
    }
  };

  try {
    Services.obs.addObserver(observer, "http-on-modify-request", false);
    Services.obs.addObserver(observer, "http-on-examine-response", false);
    Services.obs.addObserver(observer, "http-on-examine-cached-response", false);
    Services.obs.addObserver(observer, "http-on-examine-merged-response", false);

    controller.open(aUrl);
    controller.waitForPageLoad();

    expect.equal(request.responseType, aResponseType,
                 "Page has been loaded from the expected source.");

    expect.equal(request.responseStatus, 200,
                 "The expected response status is set.");

    assert.ok(request.succeeded,
              "HTTPd.js successfully loaded the local page: " + aUrl);
  }
  finally {
    try {
      Services.obs.removeObserver(observer, "http-on-modify-request", false);
      Services.obs.removeObserver(observer, "http-on-examine-response", false);
      Services.obs.removeObserver(observer, "http-on-examine-cached-response", false);
      Services.obs.removeObserver(observer, "http-on-examine-merged-response", false);
    }
    catch (e) {
    }
  }
}


function teardownModule(aModule) {
  Services.prefs.clearUserPref("browser.cache.disk.enable");
  Services.prefs.clearUserPref("browser.cache.memory.enable");
}
