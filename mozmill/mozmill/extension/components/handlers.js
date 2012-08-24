/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

// Import global modules
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Services.jsm");


/**
 * XPCOM component to setup necessary listeners for Mozmill.
 */
function MozmillHandlers() {

}

MozmillHandlers.prototype = {
  classDescription: "MozmillHandlers",
  classID: Components.ID("{06aff66f-4925-42e1-87f8-acaeaa22cabf}"),
  contractID: "@mozilla.org/mozmill-handlers;1",
  QueryInterface: XPCOMUtils.generateQI([Ci.nsIObserver]),

  _xpcom_categories: [{category: "profile-after-change"}],

  /**
   * Handler for registered observer notifications.
   *
   * @param {String} aSubject
   *        Subject of the observer message (not used)
   * @param {String} aTopic
   *        Topic of the observer message
   * @param {Object} aData
   *        Data of the observer message (not used)
   */
  observe: function MozmillHandlers_observe(aSubject, aTopic, aData) {
    switch (aTopic) {
      // The server cannot be started before the ui is shown. That means
      // we also have to register for the final-ui-startup notification.
      case "profile-after-change":
        Services.console.registerListener(ConsoleObserver);

        Services.obs.addObserver(this, "sessionstore-windows-restored", false);
        Services.obs.addObserver(this, "quit-application", false);

        break;

      case "sessionstore-windows-restored":
        Services.obs.removeObserver(this, "sessionstore-windows-restored", false);

        break;

      case "quit-application":
        Services.obs.removeObserver(this, "quit-application", false);

        Services.console.unregisterListener(ConsoleObserver);
        break;
    }
  }
}


var ConsoleObserver = {
  observe: function (aSubject, aTopic, aData) {
    var msg = aSubject.message;
    var re = /^\[.*Error:.*(chrome|resource):\/\/(mozmill|jsbridge).*/i;
    if (msg.match(re)) {
      Cu.import("resource://jsbridge/modules/Events.jsm");

      Events.fireEvent("mozmill.frameworkFail", {message: msg});
      Events.fireEvent("mozmill.userShutdown", {
        'user': false,
        'restart': false,
        'resetProfile': false
      });

      // Quit the application and do not wait until a timeout happens
      var appStartup = Cc["@mozilla.org/toolkit/app-startup;1"]
                       .getService(Ci.nsIAppStartup);
      appStartup.quit(Ci.nsIAppStartup.eAttemptQuit);
    }
  }
}

const NSGetFactory = XPCOMUtils.generateNSGetFactory([Mozmill]);
