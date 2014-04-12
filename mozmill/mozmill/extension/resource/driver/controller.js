/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

var EXPORTED_SYMBOLS = ["MozMillController", "globalEventRegistry",
                        "sleep", "windowMap"];

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

var EventUtils = {}; Cu.import('resource://mozmill/stdlib/EventUtils.js', EventUtils);

var assertions = {}; Cu.import('resource://mozmill/modules/assertions.js', assertions);
var broker = {}; Cu.import('resource://mozmill/driver/msgbroker.js', broker);
var elementslib = {}; Cu.import('resource://mozmill/driver/elementslib.js', elementslib);
var errors = {}; Cu.import('resource://mozmill/modules/errors.js', errors);
var mozelement = {}; Cu.import('resource://mozmill/driver/mozelement.js', mozelement);
var utils = {}; Cu.import('resource://mozmill/stdlib/utils.js', utils);
var windows = {}; Cu.import('resource://mozmill/modules/windows.js', windows);

// Declare most used utils functions in the controller namespace
var assert = new assertions.Assert();
var waitFor = assert.waitFor;

var sleep = utils.sleep;

// For Mozmill 1.5 backward compatibility
var windowMap = windows.map;

waitForEvents = function () {
}

waitForEvents.prototype = {
  /**
   * Initialize list of events for given node
   */
  init: function waitForEvents_init(node, events) {
    if (node.getNode != undefined)
      node = node.getNode();

    this.events = events;
    this.node = node;
    node.firedEvents = {};
    this.registry = {};

    for each (var e in events) {
      var listener = function (event) {
        this.firedEvents[event.type] = true;
      }

      this.registry[e] = listener;
      this.registry[e].result = false;
      this.node.addEventListener(e, this.registry[e], true);
    }
  },

  /**
   * Wait until all assigned events have been fired
   */
  wait: function waitForEvents_wait(timeout, interval) {
    for (var e in this.registry) {
      assert.waitFor(function () {
        return this.node.firedEvents[e] == true;
      }, "waitForEvents.wait(): Event '" + ex + "' has been fired.", timeout, interval);

      this.node.removeEventListener(e, this.registry[e], true);
    }
  }
}

/**
 * Class to handle menus and context menus
 *
 * @constructor
 * @param {MozMillController} controller
 *        Mozmill controller of the window under test
 * @param {string} menuSelector
 *        jQuery like selector string of the element
 * @param {object} document
 *        Document to use for finding the menu
 *        [optional - default: aController.window.document]
 */
function Menu(controller, menuSelector, document) {
  this._controller = controller;
  this._menu = null;

  document = document || controller.window.document;
  var node = document.querySelector(menuSelector);
  if (node) {
    // We don't unwrap nodes automatically yet (Bug 573185)
    node = node.wrappedJSObject || node;
    this._menu = new mozelement.Elem(node);
  } else {
    throw new Error("Menu element '" + menuSelector + "' not found.");
  }
}

Menu.prototype = {

  /**
   * Open and populate the menu
   *
   * @param {ElemBase} contextElement
   *        Element whose context menu has to be opened
   * @returns {Menu} The Menu instance
   */
  open: function Menu_open(contextElement) {
    // We have to open the context menu
    var menu = this._menu.getNode();
    if ((menu.localName == "popup" || menu.localName == "menupopup") &&
        contextElement && contextElement.exists()) {
      contextElement.rightClick();
      assert.waitFor(function () {
        return menu.state == "open";
      }, "Context menu has been opened.");
    }

    // Run through the entire menu and populate with dynamic entries
    this._buildMenu(menu);

    return this;
  },

  /**
   * Close the menu
   *
   * @returns {Menu} The Menu instance
   */
  close: function Menu_close() {
    var menu = this._menu.getNode();

    this._menu.keypress("VK_ESCAPE", {});
    assert.waitFor(function () {
      return menu.state == "closed";
    }, "Context menu has been closed.");

    return this;
  },

  /**
   * Retrieve the specified menu entry
   *
   * @param {string} itemSelector
   *        jQuery like selector string of the menu item
   * @returns {ElemBase} Menu element
   * @throws Error If menu element has not been found
   */
  getItem: function Menu_getItem(itemSelector) {
    // Run through the entire menu and populate with dynamic entries
    this._buildMenu(this._menu.getNode());

    var node = this._menu.getNode().querySelector(itemSelector);

    if (!node) {
      throw new Error("Menu entry '" + itemSelector + "' not found.");
    }

    return new mozelement.Elem(node);
  },

  /**
   * Click the specified menu entry
   *
   * @param {string} itemSelector
   *        jQuery like selector string of the menu item
   *
   * @returns {Menu} The Menu instance
   */
  click: function Menu_click(itemSelector) {
    this.getItem(itemSelector).click();

    return this;
  },

  /**
   * Synthesize a keypress against the menu
   *
   * @param {string} key
   *        Key to press
   * @param {object} modifier
   *        Key modifiers
   * @see MozMillController#keypress
   *
   * @returns {Menu} The Menu instance
   */
  keypress: function Menu_keypress(key, modifier) {
    this._menu.keypress(key, modifier);

    return this;
  },

  /**
   * Opens the context menu, click the specified entry and
   * make sure that the menu has been closed.
   *
   * @param {string} itemSelector
   *        jQuery like selector string of the element
   * @param {ElemBase} contextElement
   *        Element whose context menu has to be opened
   *
   * @returns {Menu} The Menu instance
   */
  select: function Menu_select(itemSelector, contextElement) {
    this.open(contextElement);
    this.click(itemSelector);
    this.close();
  },

  /**
   * Recursive function which iterates through all menu elements and
   * populates the menus with dynamic menu entries.
   *
   * @param {node} menu
   *        Top menu node whose elements have to be populated
   */
  _buildMenu: function Menu__buildMenu(menu) {
    var items = menu ? menu.childNodes : null;

    Array.forEach(items, function (item) {
      // When we have a menu node, fake a click onto it to populate
      // the sub menu with dynamic entries
      if (item.tagName == "menu") {
        var popup = item.querySelector("menupopup");

        if (popup) {
          var popupEvent = this._controller.window.document.createEvent("MouseEvent");
          popupEvent.initMouseEvent("popupshowing", true, true,
                                    this._controller.window, 0, 0, 0, 0, 0,
                                    false, false, false, false, 0, null);
          popup.dispatchEvent(popupEvent);

          this._buildMenu(popup);
        }
      }
    }, this);
  }
};

function MozMillController(window) {
  this.window = window;

  this.mozmillModule = {};
  Cu.import('resource://mozmill/driver/mozmill.js', this.mozmillModule);

  var self = this;
  assert.waitFor(function () {
    return window != null && self.isLoaded();
  }, "controller(): Window has been initialized.");

  // Ensure to focus the window which will move it virtually into the foreground
  // when focusmanager.testmode is set enabled.
  this.window.focus();

  var windowType = window.document.documentElement.getAttribute('windowtype');
  if (controllerAdditions[windowType] != undefined ) {
    this.prototype = new utils.Copy(this.prototype);
    controllerAdditions[windowType](this);
    this.windowtype = windowType;
  }
}

/**
 * Returns the global browser object of the window
 *
 * @returns {Object} The browser object
 */
MozMillController.prototype.__defineGetter__("browserObject", function () {
  return utils.getBrowserObject(this.window);
});

// constructs a MozMillElement from the controller's window
MozMillController.prototype.__defineGetter__("rootElement", function () {
  if (this._rootElement == undefined) {
    let docElement = this.window.document.documentElement;
    this._rootElement = new mozelement.MozMillElement("Elem", docElement);
  }

  return this._rootElement;
});

MozMillController.prototype.sleep = utils.sleep;
MozMillController.prototype.waitFor = assert.waitFor;

// Open the specified url in the current tab
MozMillController.prototype.open = function mc_open(url) {
  switch (this.mozmillModule.Application) {
    case "Firefox":
    case "MetroFirefox":
      // Stop a running page load to not overlap requests
      if (this.browserObject.selectedBrowser) {
        this.browserObject.selectedBrowser.stop();
      }

      this.browserObject.loadURI(url);
      break;

    default:
      throw new Error("MozMillController.open not supported.");
  }

  broker.pass({'function':'Controller.open()'});
}

/**
 * Take a screenshot of specified node
 *
 * @param {Element} node
 *        The window or DOM element to capture
 * @param {String} name
 *        The name of the screenshot used in reporting and as filename
 * @param {Boolean} save
 *        If true saves the screenshot as 'name.jpg' in tempdir,
 *        otherwise returns a dataURL
 * @param {Element[]} highlights
 *        A list of DOM elements to highlight by drawing a red rectangle around them
 *
 * @returns {Object} Object which contains properties like filename, dataURL,
 *          name and timestamp of the screenshot
 */
MozMillController.prototype.screenshot = function mc_screenshot(node, name, save, highlights) {
  if (!node) {
    throw new Error("node is undefined");
  }

  // Unwrap the node and highlights
  if ("getNode" in node) {
    node = node.getNode();
  }

  if (highlights) {
    for (var i = 0; i < highlights.length; ++i) {
      if ("getNode" in highlights[i]) {
        highlights[i] = highlights[i].getNode();
      }
    }
  }

  // If save is false, a dataURL is used
  // Include both in the report anyway to avoid confusion and make the report easier to parse
  var screenshot = {"filename": undefined,
                    "dataURL": utils.takeScreenshot(node, highlights),
                    "name": name,
                    "timestamp": new Date().toLocaleString()};

  if (!save) {
    return screenshot;
  }

  // Save the screenshot to disk

  let {filename, failure} = utils.saveDataURL(screenshot.dataURL, name);
  screenshot.filename = filename;
  screenshot.failure = failure;

  if (failure) {
    broker.log({'function': 'controller.screenshot()',
                'message': 'Error writing to file: ' + screenshot.filename});
  } else {
    // Send the screenshot object to python over jsbridge
    broker.sendMessage("screenshot", screenshot);
    broker.pass({'function': 'controller.screenshot()'});
  }

  return screenshot;
}

/**
 * Checks if the specified window has been loaded
 *
 * @param {DOMWindow} [aWindow=this.window] Window object to check for loaded state
 */
MozMillController.prototype.isLoaded = function mc_isLoaded(aWindow) {
  var win = aWindow || this.window;

  return windows.map.getValue(utils.getWindowId(win), "loaded") || false;
};

MozMillController.prototype.__defineGetter__("waitForEvents", function () {
  if (this._waitForEvents == undefined) {
    this._waitForEvents = new waitForEvents();
  }

  return this._waitForEvents;
});

/**
 * Wrapper function to create a new instance of a menu
 * @see Menu
 */
MozMillController.prototype.getMenu = function mc_getMenu(menuSelector, document) {
  return new Menu(this, menuSelector, document);
};

MozMillController.prototype.__defineGetter__("mainMenu", function () {
  return this.getMenu("menubar");
});

MozMillController.prototype.__defineGetter__("menus", function () {
  logDeprecated('controller.menus', 'Use controller.mainMenu instead');
});

MozMillController.prototype.waitForImage = function mc_waitForImage(aElement, timeout, interval) {
  this.waitFor(function () {
    return aElement.getNode().complete == true;
  }, "timeout exceeded for waitForImage " + aElement.getInfo(), timeout, interval);

  broker.pass({'function':'Controller.waitForImage()'});
}

MozMillController.prototype.startUserShutdown = function mc_startUserShutdown(timeout, restart, next, resetProfile) {
  if (restart && resetProfile) {
    throw new Error("You can't have a user-restart and reset the profile; there is a race condition");
  }

  let shutdownObj = {
    'user': true,
    'restart': Boolean(restart),
    'next': next,
    'resetProfile': Boolean(resetProfile),
    'timeout': timeout
  };

  broker.sendMessage('shutdown', shutdownObj);
}

/**
 * Restart the application
 *
 * @param {string} aNext
 *        Name of the next test function to run after restart
 * @param {boolean} [aFlags=undefined]
 *        Additional flags how to handle the shutdown or restart. The attributes
 *        eRestarti386 (0x20) and eRestartx86_64 (0x30) have not been documented yet.
 * @see https://developer.mozilla.org/nsIAppStartup#Attributes
 */
MozMillController.prototype.restartApplication = function mc_restartApplication(aNext, aFlags) {
  var flags = Ci.nsIAppStartup.eAttemptQuit | Ci.nsIAppStartup.eRestart;

  if (aFlags) {
    flags |= aFlags;
  }

  broker.sendMessage('shutdown', {'user': false,
                                  'restart': true,
                                  'flags': flags,
                                  'next': aNext,
                                  'timeout': 0 });

  // We have to ensure to stop the test from continuing until the application is
  // shutting down. The only way to do that is by throwing an exception.
  throw new errors.ApplicationQuitError();
}

/**
 * Stop the application
 *
 * @param {boolean} [aResetProfile=false]
 *        Whether to reset the profile during restart
 * @param {boolean} [aFlags=undefined]
 *        Additional flags how to handle the shutdown or restart. The attributes
 *        eRestarti386 and eRestartx86_64 have not been documented yet.
 * @see https://developer.mozilla.org/nsIAppStartup#Attributes
 */
MozMillController.prototype.stopApplication = function mc_stopApplication(aResetProfile, aFlags) {
  var flags = Ci.nsIAppStartup.eAttemptQuit;

  if (aFlags) {
    flags |= aFlags;
  }

  broker.sendMessage('shutdown', {'user': false,
                                  'restart': false,
                                  'flags': flags,
                                  'resetProfile': aResetProfile,
                                  'timeout': 0 });

  // We have to ensure to stop the test from continuing until the application is
  // shutting down. The only way to do that is by throwing an exception.
  throw new errors.ApplicationQuitError();
}

//Browser navigation functions
MozMillController.prototype.goBack = function mc_goBack() {
  this.window.content.history.back();
  broker.pass({'function':'Controller.goBack()'});

  return true;
}

MozMillController.prototype.goForward = function mc_goForward() {
  this.window.content.history.forward();
  broker.pass({'function':'Controller.goForward()'});

  return true;
}

MozMillController.prototype.refresh = function mc_refresh() {
  this.window.content.location.reload(true);
  broker.pass({'function':'Controller.refresh()'});

  return true;
}

function logDeprecated(funcName, message) {
  broker.log({'function': funcName + '() - DEPRECATED',
              'message': funcName + '() is deprecated. ' + message});
}

function Tabs(controller) {
  this.controller = controller;
}

Tabs.prototype.getTab = function Tabs_getTab(index) {
  return this.controller.browserObject.browsers[index].contentDocument;
}

Tabs.prototype.__defineGetter__("activeTab", function () {
  return this.controller.browserObject.selectedBrowser.contentDocument;
});

Tabs.prototype.selectTab = function Tabs_selectTab(index) {
  // GO in to tab manager and grab the tab by index and call focus.
}

Tabs.prototype.findWindow = function Tabs_findWindow(doc) {
  for (var i = 0; i <= (this.controller.window.frames.length - 1); i++) {
    if (this.controller.window.frames[i].document == doc) {
      return this.controller.window.frames[i];
    }
  }

  throw new Error("Cannot find window for document. Doc title == " + doc.title);
}

Tabs.prototype.getTabWindow = function Tabs_getTabWindow(index) {
  return this.findWindow(this.getTab(index));
}

Tabs.prototype.__defineGetter__("activeTabWindow", function () {
  return this.findWindow(this.activeTab);
});

Tabs.prototype.__defineGetter__("length", function () {
  return this.controller.browserObject.browsers.length;
});

Tabs.prototype.__defineGetter__("activeTabIndex", function () {
  var browser = this.controller.browserObject;

  switch(this.controller.mozmillModule.Application) {
    case "MetroFirefox":
      return browser.tabs.indexOf(browser.selectedTab);
    case "Firefox":
    default:
      return browser.tabContainer.selectedIndex;
  }
});

Tabs.prototype.selectTabIndex = function Tabs_selectTabIndex(aIndex) {
  var browser = this.controller.browserObject;

  switch(this.controller.mozmillModule.Application) {
    case "MetroFirefox":
      browser.selectedTab = browser.tabs[aIndex];
      break;
    case "Firefox":
    default:
      browser.selectTabAtIndex(aIndex);
  }
}

function browserAdditions (controller) {
  controller.tabs = new Tabs(controller);

  controller.waitForPageLoad = function controller_waitForPageLoad(aDocument,
                                                                   aTimeout, aInterval) {
    var timeout = aTimeout || 30000;
    var win = null;
    var timed_out = false;

    // If a user tries to do waitForPageLoad(2000), this will assign the
    // interval the first arg which is most likely what they were expecting
    if (typeof(aDocument) == "number"){
      timeout = aDocument;
    }

    // If we have a real document use its default view
    if (aDocument && (typeof(aDocument) === "object") &&
        "defaultView" in aDocument)
      win = aDocument.defaultView;

    // If no document has been specified, fallback to the default view of the
    // currently selected tab browser
    win = win || this.browserObject.selectedBrowser.contentWindow;

    // Wait until the content in the tab has been loaded
    try {
      this.waitFor(function () {
        return windows.map.hasPageLoaded(utils.getWindowId(win));
      }, "Timeout", timeout, aInterval);
    }
    catch (ex if ex instanceof errors.TimeoutError) {
      timed_out = true;
    }
    finally {
      state = 'URI=' + win.document.location.href +
              ', readyState=' + win.document.readyState;
      message = "controller.waitForPageLoad(" + state + ")";

      if (timed_out) {
        throw new errors.AssertionError(message);
      }

      broker.pass({'function': message});
    }
  }
}

var controllerAdditions = {
  'navigator:browser'  :browserAdditions
};
