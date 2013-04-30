/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

var EXPORTED_SYMBOLS = ["controller", "utils", "elementslib", "os",
                        "getBrowserController", "newBrowserController",
                        "getAddonsController", "getPreferencesController",
                        "newMail3PaneController", "getMail3PaneController",
                        "wm", "platform", "getAddrbkController",
                        "getMsgComposeController", "getDownloadsController",
                        "Application", "cleanQuit", "findElement",
                        "getPlacesController", 'isMac', 'isLinux', 'isWindows',
                        "firePythonCallback"
                       ];

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

const DEBUG = false;

// imports
var controller = {};  Cu.import('resource://mozmill/driver/controller.js', controller);
var elementslib = {}; Cu.import('resource://mozmill/driver/elementslib.js', elementslib);
var broker = {};      Cu.import('resource://mozmill/driver/msgbroker.js', broker);
var findElement = {}; Cu.import('resource://mozmill/driver/mozelement.js', findElement);
var utils = {};       Cu.import('resource://mozmill/stdlib/utils.js', utils);
var os = {};          Cu.import('resource://mozmill/stdlib/os.js', os);

// This is a useful "check" timer. See utils.js, good for debugging
if (DEBUG) {
  utils.startTimer();
}

try {
  Cu.import("resource://gre/modules/AddonManager.jsm");
} catch (e) {
  /* Firefox 4 only */
}

// platform information
var platform = os.getPlatform();
var isMac = false;
var isWindows = false;
var isLinux = false;

if (platform == "darwin"){
  isMac = true;
}

if (platform == "winnt"){
  isWindows = true;
}

if (platform == "linux"){
  isLinux = true;
}

var appInfo = Cc["@mozilla.org/xre/app-info;1"].getService(Ci.nsIXULAppInfo);
var wm = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);

const applicationDictionary = {
  "{718e30fb-e89b-41dd-9da7-e25a45638b28}": "Sunbird",
  "{92650c4d-4b8e-4d2a-b7eb-24ecf4f6b63a}": "SeaMonkey",
  "{ec8030f7-c20a-464f-9b0e-13a3a9e97384}": "Firefox",
  "{3550f703-e582-4d05-9a08-453d09bdfdc6}": 'Thunderbird'
};

var Application = applicationDictionary[appInfo.ID];

if (Application == undefined) {
  // Default to Firefox
  var Application = 'Firefox';
}

// get startup time if available
// see http://blog.mozilla.com/tglek/2011/04/26/measuring-startup-speed-correctly/
function getStartupInfo() {
  var startupInfo = {};

  try {
    var _startupInfo = Cc["@mozilla.org/toolkit/app-startup;1"]
                       .getService(Ci.nsIAppStartup).getStartupInfo();
    for (var time in _startupInfo) {
      // convert from Date object to ms since epoch
      startupInfo[time] = _startupInfo[time].getTime();
    }
  } catch (e) {
    startupInfo = null;
  }

  return startupInfo;
}

// keep list of installed addons to send to jsbridge for test run report
var addons = "null"; // this will be JSON parsed
if (typeof AddonManager != "undefined") {
  AddonManager.getAllAddons(function (addonList) {
      var converter = Cc["@mozilla.org/intl/scriptableunicodeconverter"]
                      .createInstance(Ci.nsIScriptableUnicodeConverter);
      converter.charset = 'utf-8';

      function replacer(key, value) {
        if (typeof(value) == "string") {
          try {
            return converter.ConvertToUnicode(value);
          } catch (e) {
            var newstring = '';
            for (var i=0; i < value.length; i++) {
              replacement = '';
              if ((32 <= value.charCodeAt(i)) && (value.charCodeAt(i) < 127)) {
                // eliminate non-convertable characters;
                newstring += value.charAt(i);
              } else {
                newstring += replacement;
              }
            }
            return newstring;
          }
        }

        return value;
      }

      // Bug 793764: Extra encode add-on details to circumvent
      // an unicode issue with JSBridge
      addons = converter.ConvertToUnicode(JSON.stringify(addonList, replacer));
  });
}

/**
 * Retrieves application details for the Mozmill report
 *
 * @return {String} JSON data of application details
 */
function getApplicationDetails() {
  var locale = Cc["@mozilla.org/chrome/chrome-registry;1"]
               .getService(Ci.nsIXULChromeRegistry)
               .getSelectedLocale("global");

  // Put all our necessary information into JSON and return it:
  // appinfo, startupinfo, and addons
  var details = {
    application_id: appInfo.ID,
    application_name: appInfo.name,
    application_version: appInfo.version,
    application_locale: locale,
    platform_buildid: appInfo.platformBuildID,
    platform_version: appInfo.platformVersion,
    addons: addons,
    startupinfo: getStartupInfo()
  };

  return JSON.stringify(details);
}

function cleanQuit () {
  // Cause a quit to happen. We need the timeout in order to allow
  // jsbridge enough time to signal back to python before the shutdown starts
  // TODO: for some reason observers on shutdown don't work here?
  //       if we don't do this we crash on shutdown in linux
  var quitmethod = utils.getMethodInWindows('goQuitApplication');
  var settimeoutmethod = utils.getMethodInWindows('setTimeout');
  settimeoutmethod(quitmethod, 50);
}

function addHttpResource (directory, namespace) {
  return 'http://localhost:4545/'+namespace;
}

function newBrowserController () {
  return new controller.MozMillController(utils.getMethodInWindows('OpenBrowserWindow')());
}

function getBrowserController () {
  var browserWindow = wm.getMostRecentWindow("navigator:browser");

  if (browserWindow == null) {
    return newBrowserController();
  } else {
    return new controller.MozMillController(browserWindow);
  }
}

function getPlacesController () {
  utils.getMethodInWindows('PlacesCommandHook').showPlacesOrganizer('AllBookmarks');

  return new controller.MozMillController(wm.getMostRecentWindow(''));
}

function getAddonsController () {
  if (Application == 'SeaMonkey') {
    utils.getMethodInWindows('toEM')();
  }
  else if (Application == 'Thunderbird') {
    utils.getMethodInWindows('openAddonsMgr')();
  }
  else if (Application == 'Sunbird') {
    utils.getMethodInWindows('goOpenAddons')();
  } else {
    utils.getMethodInWindows('BrowserOpenAddonsMgr')();
  }

  return new controller.MozMillController(wm.getMostRecentWindow(''));
}

function getDownloadsController() {
  utils.getMethodInWindows('BrowserDownloadsUI')();

  return new controller.MozMillController(wm.getMostRecentWindow(''));
}

function getPreferencesController() {
  if (Application == 'Thunderbird') {
    utils.getMethodInWindows('openOptionsDialog')();
  } else {
    utils.getMethodInWindows('openPreferences')();
  }

  return new controller.MozMillController(wm.getMostRecentWindow(''));
}

// Thunderbird functions
function newMail3PaneController () {
  return new controller.MozMillController(utils.getMethodInWindows('toMessengerWindow')());
}

function getMail3PaneController () {
  var mail3PaneWindow = wm.getMostRecentWindow("mail:3pane");

  if (mail3PaneWindow == null) {
    return newMail3PaneController();
  } else {
    return new controller.MozMillController(mail3PaneWindow);
  }
}

// Thunderbird - Address book window
function newAddrbkController () {
  utils.getMethodInWindows("toAddressBook")();
  utils.sleep(2000);
  var addyWin = wm.getMostRecentWindow("mail:addressbook");

  return new controller.MozMillController(addyWin);
}

function getAddrbkController () {
  var addrbkWindow = wm.getMostRecentWindow("mail:addressbook");
  if (addrbkWindow == null) {
    return newAddrbkController();
  } else {
    return new controller.MozMillController(addrbkWindow);
  }
}

function firePythonCallback (filename, method, args, kwargs) {
  obj = {'filename': filename, 'method': method};
  obj['args'] = args || [];
  obj['kwargs'] = kwargs || {};

  broker.sendMessage("firePythonCallback", obj);
}

function timer (name) {
  this.name = name;
  this.timers = {};
  this.actions = [];

  frame.timers.push(this);
}

timer.prototype.start = function (name) {
  this.timers[name].startTime = (new Date).getTime();
}

timer.prototype.stop = function (name) {
  var t = this.timers[name];

  t.endTime = (new Date).getTime();
  t.totalTime = (t.endTime - t.startTime);
}

timer.prototype.end = function () {
  frame.events.fireEvent("timer", this);
  frame.timers.remove(this);
}

// Initialization

// Observer when a new top-level window is ready
var windowReadyObserver = {
  observe: function (aSubject, aTopic, aData) {
    attachEventListeners(aSubject);
  }
};


// Observer when a top-level window is closed
var windowCloseObserver = {
  observe: function (aSubject, aTopic, aData) {
    controller.windowMap.remove(utils.getWindowId(aSubject));
  }
};


/**
 * Attach event listeners
 *
 * @param {ChromeWindow} aWindow
 *        Window to attach listeners on.
 */
function attachEventListeners(aWindow) {
  // These are the event handlers
  var pageShowHandler = function (aEvent) {
    var doc = aEvent.originalTarget;

    // Only update the flag if we have a document as target
    // see https://bugzilla.mozilla.org/show_bug.cgi?id=690829
    if ("defaultView" in doc) {
      var id = utils.getWindowId(doc.defaultView);
      controller.windowMap.update(id, "loaded", true);
      //dump("*** pageshow event: " + id + ", " + doc.location + ", baseURI=" + doc.baseURI + "\n");
    }

    // We need to add/remove the unload/pagehide event listeners to preserve caching.
    aWindow.getBrowser().addEventListener("beforeunload", beforeUnloadHandler, true);
    aWindow.getBrowser().addEventListener("pagehide", pageHideHandler, true);
  };

  var DOMContentLoadedHandler = function (aEvent) {
    var doc = aEvent.originalTarget;

    var errorRegex = /about:.+(error)|(blocked)\?/;
    if (errorRegex.exec(doc.baseURI)) {
      // Wait about 1s to be sure the DOM is ready
      utils.sleep(1000);

      // Only update the flag if we have a document as target
      if ("defaultView" in doc) {
        var id = utils.getWindowId(doc.defaultView);
        controller.windowMap.update(id, "loaded", true);
        //dump("*** DOMContentLoaded event: " + id + ", " + doc.location + ", baseURI=" + doc.baseURI + "\n");
      }

      // We need to add/remove the unload event listener to preserve caching.
      aWindow.getBrowser().addEventListener("beforeunload", beforeUnloadHandler, true);
    }
  };

  // beforeunload is still needed because pagehide doesn't fire before the page is unloaded.
  // still use pagehide for cases when beforeunload doesn't get fired
  var beforeUnloadHandler = function (aEvent) {
    var doc = aEvent.originalTarget;

    // Only update the flag if we have a document as target
    if ("defaultView" in doc) {
      var id = utils.getWindowId(doc.defaultView);
      controller.windowMap.update(id, "loaded", false);
      //dump("*** beforeunload event: " + id + ", " + doc.location + ", baseURI=" + doc.baseURI + "\n");
    }

    aWindow.getBrowser().removeEventListener("beforeunload", beforeUnloadHandler, true);
  };

  var pageHideHandler = function (aEvent) {
    // If event.persisted is false, the beforeUnloadHandler should fire
    // and there is no need for this event handler.
    if (aEvent.persisted) {
      var doc = aEvent.originalTarget;

      // Only update the flag if we have a document as target
      if ("defaultView" in doc) {
        var id = utils.getWindowId(doc.defaultView);
        controller.windowMap.update(id, "loaded", false);
        //dump("*** pagehide event: " + id + ", " + doc.location + ", baseURI=" + doc.baseURI + "\n");
      }

      aWindow.getBrowser().removeEventListener("beforeunload", beforeUnloadHandler, true);
    }
  };

  var onWindowLoaded = function (aEvent) {
    controller.windowMap.update(utils.getWindowId(aWindow), "loaded", true);

    var browser = ("getBrowser" in aWindow) ? aWindow.getBrowser() : null;
    if (browser) {
      // Page is ready
      browser.addEventListener("pageshow", pageShowHandler, true);

      // Note: Error pages will never fire a "pageshow" event. For those we
      // have to wait for the "DOMContentLoaded" event. That's the final state.
      // Error pages will always have a baseURI starting with
      // "about:" followed by "error" or "blocked".
      browser.addEventListener("DOMContentLoaded", DOMContentLoadedHandler, true);

      // Leave page (use caching)
      browser.addEventListener("pagehide", pageHideHandler, true);
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
  observerService.addObserver(windowReadyObserver, "toplevel-window-ready", false);
  observerService.addObserver(windowCloseObserver, "outer-window-destroyed", false);

  // Attach event listeners to all already open top-level windows
  var enumerator = Cc["@mozilla.org/appshell/window-mediator;1"].
                   getService(Ci.nsIWindowMediator).getEnumerator("");
  while (enumerator.hasMoreElements()) {
    var win = enumerator.getNext();

    // For top-level windows which are already open set the loaded state
    // to the current readyState. For slowly loading windows (like for debug
    // builds) it will be overwritten again by the onload listener later.
    var loaded = (win.document.readyState === 'complete');
    controller.windowMap.update(utils.getWindowId(win), "loaded", loaded);

    attachEventListeners(win);
  }
}

initialize();
