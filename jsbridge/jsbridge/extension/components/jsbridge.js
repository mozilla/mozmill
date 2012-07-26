/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

// Import global modules
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Services.jsm");

// Include local modules
Cu.import("resource://jsbridge/modules/Log.jsm");


// Constants for preferences names
const PREF_JSBRIDGE_PORT = "extensions.jsbridge.port";


/**
 * XPCOM component to observe different application states and to
 * handle the JSBridge server.
 */
function JSBridge() {
  this._server = null;
}

JSBridge.prototype = {
  classDescription: "JSBridge",
  classID: Components.ID("{2872d428-14f6-11de-ac86-001f5bd9235c}"),
  contractID: "@mozilla.org/jsbridge;1",
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
  observe: function JSB_observe(aSubject, aTopic, aData) {
    Log.dump("Observer topic", aTopic);

    switch (aTopic) {
      // The server cannot be started before the ui is shown. That means
      // we also have to register for the final-ui-startup notification.
      case "profile-after-change":
        Services.obs.addObserver(this, "quit-application", false);

        // The port the server has to be started on is set via a preference
        let port = Services.prefs.getIntPref(PREF_JSBRIDGE_PORT);

        // Start the server
        Cu.import('resource://jsbridge/modules/Server.jsm');
        this._server = new Server.Server(port);
        this._server.start();

        break;

      case "quit-application":
        Services.obs.removeObserver(this, "quit-application", false);

        // Stop the server
        this._server.stop();
        this._server = null;
        break;
    }
  }
}

const NSGetFactory = XPCOMUtils.generateNSGetFactory([JSBridge]);
