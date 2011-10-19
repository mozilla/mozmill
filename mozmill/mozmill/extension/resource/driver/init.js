/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 * 
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 * 
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 * 
 * The Original Code is Mozilla Corporation Code.
 * 
 * The Initial Developer of the Original Code is
 * Adam Christian.
 * Portions created by the Initial Developer are Copyright (C) 2008
 * the Initial Developer. All Rights Reserved.
 * 
 * Contributor(s):
 *  Adam Christian <adam.christian@gmail.com>
 *  Mikeal Rogers <mikeal.rogers@gmail.com>
 *  Henrik Skupin <hskupin@mozilla.com>
 * 
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 * 
 * ***** END LICENSE BLOCK ***** */

var broker = {}; Components.utils.import('resource://mozmill/driver/msgbroker.js', broker);

/**
* Console listener which listens for error messages in the console and forwards
* them to the Mozmill reporting system for output.
*/
function ConsoleListener() {
 this.register();
}
ConsoleListener.prototype = {
 observe: function(aMessage) {
   var msg = aMessage.message;
   var re = /^\[.*Error:.*(chrome|resource):\/\/.*/i;
   if (msg.match(re)) {
     broker.fail(aMessage);
   }
 },
 QueryInterface: function (iid) {
	if (!iid.equals(Components.interfaces.nsIConsoleListener) && !iid.equals(Components.interfaces.nsISupports)) {
		throw Components.results.NS_ERROR_NO_INTERFACE;
   }
   return this;
 },
 register: function() {
   var aConsoleService = Components.classes["@mozilla.org/consoleservice;1"]
                              .getService(Components.interfaces.nsIConsoleService);
   aConsoleService.registerListener(this);
 },
 unregister: function() {
   var aConsoleService = Components.classes["@mozilla.org/consoleservice;1"]
                              .getService(Components.interfaces.nsIConsoleService);
   aConsoleService.unregisterListener(this);
 }
}

// start listening
var consoleListener = new ConsoleListener();

var EXPORTED_SYMBOLS = ["mozmill"];
  
const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;
  
var mozmill = Cu.import('resource://mozmill/driver/mozmill.js');
  
// Observer for new top level windows
var windowObserver = {
  observe: function(subject, topic, data) {
    attachEventListeners(subject);
  }
};
  
/**
 * Attach event listeners
 */
function attachEventListeners(aWindow) {
  // These are the event handlers
  function pageShowHandler(event) {
    var doc = event.originalTarget;

    // Only update the flag if we have a document as target
    // see https://bugzilla.mozilla.org/show_bug.cgi?id=690829
    if ("defaultView" in doc) {
      doc.defaultView.mozmillDocumentLoaded = true;
    }

    // We need to add/remove the unload/pagehide event listeners to preserve caching.
    aWindow.gBrowser.addEventListener("beforeunload", beforeUnloadHandler, true);
    aWindow.gBrowser.addEventListener("pagehide", pageHideHandler, true);
  };

  function DOMContentLoadedHandler(event) {
    var doc = event.originalTarget;

    var errorRegex = /about:.+(error)|(blocked)\?/;
    if (errorRegex.exec(doc.baseURI)) {
      // Wait about 1s to be sure the DOM is ready
      mozmill.utils.sleep(1000);

      // Only update the flag if we have a document as target
      if ("defaultView" in doc) {
        doc.defaultView.mozmillDocumentLoaded = true;
      }

      // We need to add/remove the unload event listener to preserve caching.
      aWindow.gBrowser.addEventListener("beforeunload", beforeUnloadHandler, true);
    }
  };
  
  // beforeunload is still needed because pagehide doesn't fire before the page is unloaded.
  // still use pagehide for cases when beforeunload doesn't get fired
  function beforeUnloadHandler(event) {
    var doc = event.originalTarget;

    // Only update the flag if we have a document as target
    if ("defaultView" in doc) {
      doc.defaultView.mozmillDocumentLoaded = false;
    }

    aWindow.gBrowser.removeEventListener("beforeunload", beforeUnloadHandler, true);
  };

  function pageHideHandler(event) {
    // If event.persisted is false, the beforeUnloadHandler should fire
    // and there is no need for this event handler.
    if (event.persisted) {
      var doc = event.originalTarget;

      // Only update the flag if we have a document as target
      if ("defaultView" in doc) {
        doc.defaultView.mozmillDocumentLoaded = false;
      }

      aWindow.gBrowser.removeEventListener("beforeunload", beforeUnloadHandler, true);
    }

  };

  function onWindowLoaded(event) {
    aWindow.mozmillDocumentLoaded = true;

    if ("gBrowser" in aWindow) {
      // Page is ready
      aWindow.gBrowser.addEventListener("pageshow", pageShowHandler, true);

      // Note: Error pages will never fire a "load" event. For those we
      // have to wait for the "DOMContentLoaded" event. That's the final state.
      // Error pages will always have a baseURI starting with
      // "about:" followed by "error" or "blocked".
      aWindow.gBrowser.addEventListener("DOMContentLoaded", DOMContentLoadedHandler, true);
    
      // Leave page (use caching)
      aWindow.gBrowser.addEventListener("pagehide", pageHideHandler, true);
    }

  }

  // Add the event handlers to the tabbedbrowser once its window has loaded
  if (aWindow.content) {
    onWindowLoaded();
  } else {
    aWindow.addEventListener("load", onWindowLoaded, false);
  }
}
  
/**
 * Initialize Mozmill
 */
function initialize() {
  // Activate observer for new top level windows
  var observerService = Cc["@mozilla.org/observer-service;1"].
                        getService(Ci.nsIObserverService);
  observerService.addObserver(windowObserver, "toplevel-window-ready", false);

  // Attach event listeners to all open windows
  var enumerator = Cc["@mozilla.org/appshell/window-mediator;1"].
                   getService(Ci.nsIWindowMediator).getEnumerator("");
  while (enumerator.hasMoreElements()) {
    var win = enumerator.getNext();
    attachEventListeners(win);

    // For windows or dialogs already open we have to explicitly set the property
    // otherwise windows which load really quick never gets the property set and
    // we fail to create the controller
    win.mozmillDocumentLoaded = true;
  };
}

initialize();

