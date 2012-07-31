/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var EXPORTED_SYMBOLS = ["openFile", "saveFile", "saveAsFile", "genBoiler", 
                        "getFile", "Copy", "getChromeWindow", "getWindows", "runEditor",
                        "runFile", "getWindowByTitle", "getWindowByType", "getWindowId",
                        "tempfile", "getMethodInWindows", "getPreference", "setPreference",
                        "sleep", "assert", "unwrapNode", "TimeoutError", "waitFor",
                        "saveScreenshot", "takeScreenshot", "startTimer", "stopTimer",
                       ];

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;


Cu.import("resource://gre/modules/NetUtil.jsm");


var hwindow = Cc["@mozilla.org/appshell/appShellService;1"]
              .getService(Ci.nsIAppShellService).hiddenDOMWindow;

var uuidgen = Cc["@mozilla.org/uuid-generator;1"].getService(Ci.nsIUUIDGenerator);

function Copy (obj) {
  for (var n in obj) {
    this[n] = obj[n];
  }
}

function getChromeWindow(aWindow) {
  var chromeWin = aWindow.QueryInterface(Ci.nsIInterfaceRequestor)
                  .getInterface(Ci.nsIWebNavigation)
                  .QueryInterface(Ci.nsIDocShellTreeItem)
                  .rootTreeItem
                  .QueryInterface(Ci.nsIInterfaceRequestor)
                  .getInterface(Ci.nsIDOMWindow)
                  .QueryInterface(Ci.nsIDOMChromeWindow);

  return chromeWin;
}

function getWindows(type) {
  if (type == undefined) {
    type = "";
  }

  var windows = [];
  var enumerator = Cc["@mozilla.org/appshell/window-mediator;1"]
                   .getService(Ci.nsIWindowMediator).getEnumerator(type);

  while (enumerator.hasMoreElements()) {
    windows.push(enumerator.getNext());
  }

  if (type == "") {
    windows.push(hwindow);
  }

  return windows;
}

function getMethodInWindows(methodName) {
  for each (var w in getWindows()) {
    if (w[methodName] != undefined) {
      return w[methodName];
    }
  }

  throw new Error("Method with name: '" + methodName + "' is not in any open window.");
}

function getWindowByTitle(title) {
  for each (var w in getWindows()) {
    if (w.document.title && w.document.title == title) {
      return w;
    }
  }

  throw new Error("Window with title: '" + title + "' not found.");
}

function getWindowByType(type) {
  var wm = Cc["@mozilla.org/appshell/window-mediator;1"]
           .getService(Ci.nsIWindowMediator);

  return wm.getMostRecentWindow(type);
}

/**
 * Retrieve the outer window id for the given window.
 * 
 * @param {Number} aWindow
 *        Window to retrieve the id from.
 * @returns {Boolean} The outer window id
 **/
function getWindowId(aWindow) {
  try {
    // Normally we can retrieve the id via window utils
    return aWindow.QueryInterface(Ci.nsIInterfaceRequestor).
                   getInterface(Ci.nsIDOMWindowUtils).
                   outerWindowID;
  } catch (e) {
    // ... but for observer notifications we need another interface
    return aWindow.QueryInterface(Ci.nsISupportsPRUint64).data;
  }
}

function tempfile(appention) {
  if (appention == undefined) {
    appention = "mozmill.utils.tempfile";
  }

  var tempfile = Cc["@mozilla.org/file/directory_service;1"]
                 .getService(Ci.nsIProperties).get("TmpD", Ci.nsIFile);
  tempfile.append(uuidgen.generateUUID().toString().replace('-', '')
                                                   .replace('{', '')
                                                   .replace('}',''));
  tempfile.create(Ci.nsIFile.DIRECTORY_TYPE, 0777);
  tempfile.append(appention);
  tempfile.createUnique(Ci.nsIFile.NORMAL_FILE_TYPE, 0666);
  // do whatever you need to the created file

  return tempfile.clone();
}

var checkChrome = function () {
  var loc = window.document.location.href;
  try {
    loc = window.top.document.location.href;
  } catch (e) {
  }

  return /^chrome:\/\//.test(loc);
}

var runFile = function (w) {
  var nsIFilePicker = Ci.nsIFilePicker;

  //define the file picker window
  var fp = Cc["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
  fp.init(w, "Select a File", nsIFilePicker.modeOpen);
  fp.appendFilter("JavaScript Files","*.js");

  // if we get a file
  var res = fp.show();
  if (res == nsIFilePicker.returnOK) {
    var thefile = fp.file;

    //create the paramObj with a files array attrib
    var paramObj = {};
    paramObj.files = [];
    paramObj.files.push(thefile.path);
  }
}

var saveFile = function (w, content, filename) {
  var file = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
  file.initWithPath(filename);

  var foStream = Cc["@mozilla.org/network/file-output-stream;1"]
                 .createInstance(Ci.nsIFileOutputStream);

  // use 0x02 | 0x10 to open file for appending.
  foStream.init(file, 0x02 | 0x08 | 0x20, 0666, 0); 
  // write, create, truncate
  // In a c file operation, we have no need to set file mode with or operation,
  // directly using "r" or "w" usually.

  foStream.write(content, content.length);
  foStream.close();
};

var saveAsFile = function (w, content) {
  var nsIFilePicker = Ci.nsIFilePicker;

  // define the file picker window
  var fp = Cc["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
  fp.init(w, "Select a File", nsIFilePicker.modeSave);
  fp.appendFilter("JavaScript Files","*.js");

  //if we get a file
  var res = fp.show();
  if ((res == nsIFilePicker.returnOK) || (res == nsIFilePicker.returnReplace)) {
    var thefile = fp.file;

    // forcing the user to save as a .js file
    if (thefile.path.indexOf(".js") == -1){
      var file = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
      file.initWithPath(thefile.path + ".js");
      var thefile = file;
    }

    // file is nsIFile, data is a string
    var foStream = Cc["@mozilla.org/network/file-output-stream;1"]
                   .createInstance(Ci.nsIFileOutputStream);

    // use 0x02 | 0x10 to open file for appending.
    foStream.init(thefile, 0x02 | 0x08 | 0x20, 0666, 0); 
    // write, create, truncate
    // In a c file operation, we have no need to set file mode with or operation,
    // directly using "r" or "w" usually.
    foStream.write(content, content.length);
    foStream.close();

    return thefile.path;
  }
}

var openFile = function (w) {
  var nsIFilePicker = Ci.nsIFilePicker;

  // define the file picker window
  var fp = Cc["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
  fp.init(w, "Select a File", nsIFilePicker.modeOpen);
  fp.appendFilter("JavaScript Files", "*.js");

  // if we get a file
  var res = fp.show();
  if (res == nsIFilePicker.returnOK) {
    var thefile = fp.file;
    var data = getFile(thefile.path);

    return {path: thefile.path, data: data};
  }
}

var getFile = function (path) {
  var file = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
  file.initWithPath(path);

  var data = "";
  var fstream = Cc["@mozilla.org/network/file-input-stream;1"]
                .createInstance(Ci.nsIFileInputStream);
  var sstream = Cc["@mozilla.org/scriptableinputstream;1"]
                .createInstance(Ci.nsIScriptableInputStream);
  fstream.init(file, -1, 0, 0);
  sstream.init(fstream); 

  //pull the contents of the file out
  var str = sstream.read(4096);
  while (str.length > 0) {
    data += str;
    str = sstream.read(4096);
  }

  sstream.close();
  fstream.close();

  //data = data.replace(/\r|\n|\r\n/g, "");
  return data;
};
 
/**
 * Called to get the state of an individual preference.
 *
 * @param aPrefName     string The preference to get the state of.
 * @param aDefaultValue any    The default value if preference was not found.
 *
 * @returns any The value of the requested preference
 *
 * @see setPref
 * Code by Henrik Skupin: <hskupin@gmail.com>
 */
function getPreference(aPrefName, aDefaultValue) {
  try {
    var branch = Cc["@mozilla.org/preferences-service;1"]
                 .getService(Ci.nsIPrefBranch);

    switch (typeof aDefaultValue) {
      case ('boolean'):
        return branch.getBoolPref(aPrefName);
      case ('string'):
        return branch.getCharPref(aPrefName);
      case ('number'):
        return branch.getIntPref(aPrefName);
      default:
        return branch.getComplexValue(aPrefName);
    }
  } catch (e) {
    return aDefaultValue;
  }
}

/**
 * Called to set the state of an individual preference.
 *
 * @param aPrefName string The preference to set the state of.
 * @param aValue    any    The value to set the preference to.
 *
 * @returns boolean Returns true if value was successfully set.
 *
 * @see getPref
 * Code by Henrik Skupin: <hskupin@gmail.com>
 */
function setPreference(aName, aValue) {
  try {
    var branch = Cc["@mozilla.org/preferences-service;1"]
                 .getService(Ci.nsIPrefBranch);

    switch (typeof aValue) {
      case ('boolean'):
        branch.setBoolPref(aName, aValue);
        break;
      case ('string'):
        branch.setCharPref(aName, aValue);
        break;
      case ('number'):
        branch.setIntPref(aName, aValue);
        break;
      default:
        branch.setComplexValue(aName, aValue);
    }
  } catch (e) {
    return false;
  }

  return true;
}

/**
 * Sleep for the given amount of milliseconds
 *
 * @param {number} milliseconds
 *        Sleeps the given number of milliseconds
 */
function sleep(milliseconds) {
  var timeup = false;

  hwindow.setTimeout(function () { timeup = true; }, milliseconds);
  var thread = Cc["@mozilla.org/thread-manager;1"]
               .getService().currentThread;
  while (!timeup) {
    thread.processNextEvent(true);
  }
}

/**
 * Check if the callback function evaluates to true
 */
function assert(callback, message, thisObject) {
  var result = callback.call(thisObject);

  if (!result) {
    throw new Error(message || arguments.callee.name + ": Failed for '" + callback + "'");
  }

  return true;
}

/**
 * Unwraps a node which is wrapped into a XPCNativeWrapper or XrayWrapper
 *
 * @param {DOMnode} Wrapped DOM node
 * @returns {DOMNode} Unwrapped DOM node
 */
function unwrapNode(aNode) {
  var node = aNode;
  if (node) {
    // unwrap is not available on older branches (3.5 and 3.6) - Bug 533596
    if ("unwrap" in XPCNativeWrapper) {	   
      node = XPCNativeWrapper.unwrap(node);
    }
    else if (node.wrappedJSObject != null) {
      node = node.wrappedJSObject;
    }
  }

  return node;
}

/**
 * TimeoutError
 *
 * Error object used for timeouts
 */
function TimeoutError(message, fileName, lineNumber) {
  var err = new Error();
  this.message = (message === undefined ? err.message : message);
  this.fileName = (fileName === undefined ? err.fileName : fileName);
  this.lineNumber = (lineNumber === undefined ? err.lineNumber : lineNumber);

  if (err.stack) {
    this.stack = err.stack;
  }
}
TimeoutError.prototype = new Error();
TimeoutError.prototype.constructor = TimeoutError;
TimeoutError.prototype.name = 'TimeoutError';

/**
 * Waits for the callback evaluates to true
 */
function waitFor(callback, message, timeout, interval, thisObject) {
  timeout = timeout || 5000;
  interval = interval || 100;

  var self = {counter: 0,
              result: callback.call(thisObject)};

  function wait() {
    self.counter += interval;
    self.result = callback.call(thisObject);
  }

  var timeoutInterval = hwindow.setInterval(wait, interval);
  var thread = Cc["@mozilla.org/thread-manager;1"]
               .getService().currentThread;

  while (true) {
    let type = typeof(self.result);
    if (type !== 'boolean')
      throw TypeError("waitFor() callback has to return a boolean" +
                      " instead of '" + type + "'");

    if (self.result === true || self.counter >= timeout)
      break;

    thread.processNextEvent(true);
  }

  hwindow.clearInterval(timeoutInterval);

  if (self.counter >= timeout) {
    message = message || arguments.callee.name + ": Timeout exceeded for '" + callback + "'";
    throw new TimeoutError(message);
  }

  return true;
}

/**
 * Calculates the x and y chrome offset for an element
 * See https://developer.mozilla.org/en/DOM/window.innerHeight
 * 
 * Note this function will not work if the user has custom toolbars (via extension) at the bottom or left/right of the screen
 */
function getChromeOffset(elem) {
  var win = elem.ownerDocument.defaultView;
  // Calculate x offset
  var chromeWidth = 0;

  if (win["name"] != "sidebar") { 
    chromeWidth = win.outerWidth - win.innerWidth;
  }

  // Calculate y offset
  var chromeHeight = win.outerHeight - win.innerHeight;
  // chromeHeight == 0 means elem is already in the chrome and doesn't need the addonbar offset
  if (chromeHeight > 0) {
    // window.innerHeight doesn't include the addon or find bar, so account for these if present
    var addonbar = win.document.getElementById("addon-bar");
    if (addonbar) {
      chromeHeight -= addonbar.scrollHeight;
    }

    var findbar = win.document.getElementById("FindToolbar");
    if (findbar) {
      chromeHeight -= findbar.scrollHeight;
    }
  }

  return {'x':chromeWidth, 'y':chromeHeight}; 
}

/**
 * Takes a screenshot of the specified DOM node 
 */
function takeScreenshot(node, highlights) {
  var rect, win, width, height, left, top, needsOffset;
  // node can be either a window or an arbitrary DOM node
  try {
    // node is an arbitrary DOM node
    win = node.ownerDocument.defaultView;
    rect = node.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    top = rect.top;
    left = rect.left;
    // offset for highlights not needed as they will be relative to this node
    needsOffset = false;
  } catch (e) {
    // node is a window
    win = node;
    width = win.innerWidth;
    height = win.innerHeight;
    top = 0;
    left = 0;
    // offset needed for highlights to take 'outerHeight' of window into account
    needsOffset = true;
  }

  var canvas = win.document.createElementNS("http://www.w3.org/1999/xhtml", "canvas");
  canvas.width = width;
  canvas.height = height;

  var ctx = canvas.getContext("2d");
  // Draws the DOM contents of the window to the canvas
  ctx.drawWindow(win, left, top, width, height, "rgb(255,255,255)");

  // This section is for drawing a red rectangle around each element passed in via the highlights array
  if (highlights) {
    ctx.lineWidth = "2";
    ctx.strokeStyle = "red";
    ctx.save();

    for (var i = 0; i < highlights.length; ++i) {
      var elem = highlights[i];
      rect = elem.getBoundingClientRect();

      var offsetY = 0, offsetX = 0;
      if (needsOffset) {
        var offset = getChromeOffset(elem);
        offsetX = offset.x;
        offsetY = offset.y;
      } else {
        // Don't need to offset the window chrome, just make relative to containing node
        offsetY = -top;
        offsetX = -left;
      }

      // Draw the rectangle
      ctx.strokeRect(rect.left + offsetX, rect.top + offsetY, rect.width, rect.height);
    }
  }

  return canvas.toDataURL("image/jpeg", 0.5);
}

/**
 * Takes a canvas as input and saves it to the file tempdir/name.png
 * Returns the filepath of the saved file
 */
function saveScreenshot(aDataURL, aFilename, aCallback) {
  const FILE_PERMISSIONS = parseInt("0644", 8);

  var frame = {}; Components.utils.import('resource://mozmill/modules/frame.js', frame);

  var file;
  if (frame.persisted['screenshotPath']) {
      file = Cc['@mozilla.org/file/local;1']
          .createInstance(Ci.nsILocalFile);
      file.initWithPath(frame.persisted['screenshotPath']);
  } else {
      file = Cc["@mozilla.org/file/directory_service;1"]
                 .getService(Ci.nsIProperties).get("TmpD", Ci.nsILocalFile);
      file.append("mozmill_screenshots");
  }
  file.append(aFilename + ".jpg");
  file.createUnique(Ci.nsIFile.NORMAL_FILE_TYPE, FILE_PERMISSIONS);

  // Create an output stream to write to file
  var foStream = Cc["@mozilla.org/network/file-output-stream;1"]
                 .createInstance(Ci.nsIFileOutputStream);
  foStream.init(file, 0x02 | 0x08 | 0x10, FILE_PERMISSIONS, foStream.DEFER_OPEN);

  // Write asynchronously to buffer;
  // Input and output streams are closed after write
  let converter = Cc["@mozilla.org/intl/scriptableunicodeconverter"]
                  .createInstance(Ci.nsIScriptableUnicodeConverter);
  converter.charset = "UTF-8";

  var iStream = converter.convertToInputStream(aDataURL);
  NetUtil.asyncCopy(iStream, foStream, function (status) {
    if (typeof(aCallback) === "function") {
      aCallback(status);
    }
  });

  return file.path;
}

/**
 * Some very brain-dead timer functions useful for performance optimizations
 * This is only enabled in debug mode
 *
 **/
var gutility_mzmltimer = 0;
/**
 * Starts timer initializing with current EPOC time in milliseconds
 *
 * @returns none
 **/
function startTimer(){
  dump("TIMERCHECK:: starting now: " + Date.now() + "\n");
  gutility_mzmltimer = Date.now();
}

/**
 * Checks the timer and outputs current elapsed time since start of timer. It
 * will print out a message you provide with its "time check" so you can
 * correlate in the log file and figure out elapsed time of specific functions.
 * 
 * @param aMsg    string The debug message to print with the timer check
 *
 * @returns none
 **/
function checkTimer(aMsg){
  var end = Date.now();
  dump("TIMERCHECK:: at " + aMsg + " is: " + (end - gutility_mzmltimer) + "\n");
}
