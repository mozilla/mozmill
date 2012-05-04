/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var EXPORTED_SYMBOLS = ["Elem", "Selector", "ID", "Link", "XPath", "Name", "Lookup",
                        "MozMillElement", "MozMillCheckBox", "MozMillRadio", "MozMillDropList",
                        "MozMillTextBox", "subclasses",
                       ];

const NAMESPACE_XUL = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";

const Ci = Components.interfaces;
const Cu = Components.utils;

var EventUtils = {};  Cu.import('resource://mozmill/stdlib/EventUtils.js', EventUtils);

var broker = {};      Cu.import('resource://mozmill/driver/msgbroker.js', broker);
var elementslib = {}; Cu.import('resource://mozmill/driver/elementslib.js', elementslib);
var utils = {};       Cu.import('resource://mozmill/stdlib/utils.js', utils);

// A list of all the subclasses available.  Shared modules can push their own subclasses onto this list
var subclasses = [MozMillCheckBox, MozMillRadio, MozMillDropList, MozMillTextBox];

/**
 * createInstance()
 *
 * Returns an new instance of a MozMillElement
 * The type of the element is automatically determined
 */
function createInstance(locatorType, locator, elem, document) {
  if (elem) {
    var args = { "element": elem,
                 "document": document };
    for (var i = 0; i < subclasses.length; ++i) {
      if (subclasses[i].isType(elem)) {
        return new subclasses[i](locatorType, locator, args);
      }
    }

    if (MozMillElement.isType(elem)) {
      return new MozMillElement(locatorType, locator, args);
    }
  }

  throw new Error("could not find element " + locatorType + ": " + locator);
};

var Elem = function (node) {
  return createInstance("Elem", node, node);
};

var Selector = function (document, selector, index) {
  return createInstance("Selector", selector, elementslib.Selector(document, selector, index), document);
};

var ID = function (document, nodeID) {
  return createInstance("ID", nodeID, elementslib.ID(document, nodeID), document);
};

var Link = function (document, linkName) {
  return createInstance("Link", linkName, elementslib.Link(document, linkName), document);
};

var XPath = function (document, expr) {
  return createInstance("XPath", expr, elementslib.XPath(document, expr), document);
};

var Name = function (document, nName) {
  return createInstance("Name", nName, elementslib.Name(document, nName), document);
};

var Lookup = function (document, expression) {
  return createInstance("Lookup", expression, elementslib.Lookup(document, expression), document);
};

/**
 * MozMillElement
 * The base class for all mozmill elements
 */
function MozMillElement(locatorType, locator, args) {
  args = args || {};
  this._locatorType = locatorType;
  this._locator = locator;
  this._element = args["element"];
  this._document = args["document"];
  this._owner = args["owner"];
  // Used to maintain backwards compatibility with controller.js
  this.isElement = true;
}

// Static method that returns true if node is of this element type
MozMillElement.isType = function (node) {
  return true;
};

// This getter is the magic behind lazy loading (note distinction between _element and element)
MozMillElement.prototype.__defineGetter__("element", function () {
  if (this._element == undefined) {
    if (elementslib[this._locatorType]) {
      this._element = elementslib[this._locatorType](this._document, this._locator);
    }
    else if (this._locatorType == "Elem") {
      this._element = this._locator;
    } else {
      throw new Error("Unknown locator type: " + this._locatorType);
    }
  }

  return this._element;
});

// Returns the actual wrapped DOM node
MozMillElement.prototype.getNode = function () {
  return this.element;
};

MozMillElement.prototype.getInfo = function () {
  return this._locatorType + ": " + this._locator;
};

/**
 * Sometimes an element which once existed will no longer exist in the DOM
 * This function re-searches for the element
 */
MozMillElement.prototype.exists = function () {
  this._element = undefined;
  if (this.element) {
    return true;
  }

  return false;
};

/**
 * Synthesize a keypress event on the given element
 *
 * @param {string} aKey
 *        Key to use for synthesizing the keypress event. It can be a simple
 *        character like "k" or a string like "VK_ESCAPE" for command keys
 * @param {object} aModifiers
 *        Information about the modifier keys to send
 *        Elements: accelKey   - Hold down the accelerator key (ctrl/meta)
 *                               [optional - default: false]
 *                  altKey     - Hold down the alt key
 *                              [optional - default: false]
 *                  ctrlKey    - Hold down the ctrl key
 *                               [optional - default: false]
 *                  metaKey    - Hold down the meta key (command key on Mac)
 *                               [optional - default: false]
 *                  shiftKey   - Hold down the shift key
 *                               [optional - default: false]
 * @param {object} aExpectedEvent
 *        Information about the expected event to occur
 *        Elements: target     - Element which should receive the event
 *                               [optional - default: current element]
 *                  type       - Type of the expected key event
 */
MozMillElement.prototype.keypress = function (aKey, aModifiers, aExpectedEvent) {
  if (!this.element) {
    throw new Error("Could not find element " + this.getInfo());
  }

  var win = this.element.ownerDocument ? this.element.ownerDocument.defaultView
                                       : this.element;
  this.element.focus();

  if (aExpectedEvent) {
    var target = aExpectedEvent.target ? aExpectedEvent.target.getNode()
                                       : this.element;
    EventUtils.synthesizeKeyExpectEvent(aKey, aModifiers || {}, target, aExpectedEvent.type,
                                        "MozMillElement.keypress()", win);
  } else {
    EventUtils.synthesizeKey(aKey, aModifiers || {}, win);
  }

  broker.pass({'function':'MozMillElement.keypress()'});

  return true;
};


/**
 * Synthesize a general mouse event on the given element
 *
 * @param {ElemBase} aTarget
 *        Element which will receive the mouse event
 * @param {number} aOffsetX
 *        Relative x offset in the elements bounds to click on
 * @param {number} aOffsetY
 *        Relative y offset in the elements bounds to click on
 * @param {object} aEvent
 *        Information about the event to send
 *        Elements: accelKey   - Hold down the accelerator key (ctrl/meta)
 *                               [optional - default: false]
 *                  altKey     - Hold down the alt key
 *                               [optional - default: false]
 *                  button     - Mouse button to use
 *                               [optional - default: 0]
 *                  clickCount - Number of counts to click
 *                               [optional - default: 1]
 *                  ctrlKey    - Hold down the ctrl key
 *                               [optional - default: false]
 *                  metaKey    - Hold down the meta key (command key on Mac)
 *                               [optional - default: false]
 *                  shiftKey   - Hold down the shift key
 *                               [optional - default: false]
 *                  type       - Type of the mouse event ('click', 'mousedown',
 *                               'mouseup', 'mouseover', 'mouseout')
 *                               [optional - default: 'mousedown' + 'mouseup']
 * @param {object} aExpectedEvent
 *        Information about the expected event to occur
 *        Elements: target     - Element which should receive the event
 *                               [optional - default: current element]
 *                  type       - Type of the expected mouse event
 */
MozMillElement.prototype.mouseEvent = function (aOffsetX, aOffsetY, aEvent, aExpectedEvent) {
  if (!this.element) {
    throw new Error(arguments.callee.name + ": could not find element " + this.getInfo());
  }

  // If no offset is given we will use the center of the element to click on.
  var rect = this.element.getBoundingClientRect();
  if (isNaN(aOffsetX)) {
    aOffsetX = rect.width / 2;
  }

  if (isNaN(aOffsetY)) {
    aOffsetY = rect.height / 2;
  }

  // Scroll element into view otherwise the click will fail
  if (this.element.scrollIntoView) {
    this.element.scrollIntoView();
  }

  if (aExpectedEvent) {
    // The expected event type has to be set
    if (!aExpectedEvent.type) {
      throw new Error(arguments.callee.name + ": Expected event type not specified");
    }

    // If no target has been specified use the specified element
    var target = aExpectedEvent.target ? aExpectedEvent.target.getNode()
                                       : this.element;
    if (!target) {
      throw new Error(arguments.callee.name + ": could not find element " +
                      aExpectedEvent.target.getInfo());
    }

    EventUtils.synthesizeMouseExpectEvent(this.element, aOffsetX, aOffsetY, aEvent,
                                          target, aExpectedEvent.event,
                                          "MozMillElement.mouseEvent()",
                                          this.element.ownerDocument.defaultView);
  } else {
    EventUtils.synthesizeMouse(this.element, aOffsetX, aOffsetY, aEvent,
                               this.element.ownerDocument.defaultView);
  }

  return true;
};

/**
 * Synthesize a mouse click event on the given element
 */
MozMillElement.prototype.click = function (left, top, expectedEvent) {
  // Handle menu items differently
  if (this.element && this.element.tagName == "menuitem") {
    this.element.click();
  } else {
    this.mouseEvent(left, top, {}, expectedEvent);
  }

  broker.pass({'function':'MozMillElement.click()'});

  return true;
};

/**
 * Synthesize a double click on the given element
 */
MozMillElement.prototype.doubleClick = function (left, top, expectedEvent) {
  this.mouseEvent(left, top, {clickCount: 2}, expectedEvent);

  broker.pass({'function':'MozMillElement.doubleClick()'});

  return true;
};

/**
 * Synthesize a mouse down event on the given element
 */
MozMillElement.prototype.mouseDown = function (button, left, top, expectedEvent) {
  this.mouseEvent(left, top, {button: button, type: "mousedown"}, expectedEvent);

  broker.pass({'function':'MozMillElement.mouseDown()'});

  return true;
};

/**
 * Synthesize a mouse out event on the given element
 */
MozMillElement.prototype.mouseOut = function (button, left, top, expectedEvent) {
  this.mouseEvent(left, top, {button: button, type: "mouseout"}, expectedEvent);

  broker.pass({'function':'MozMillElement.mouseOut()'});

  return true;
};

/**
 * Synthesize a mouse over event on the given element
 */
MozMillElement.prototype.mouseOver = function (button, left, top, expectedEvent) {
  this.mouseEvent(left, top, {button: button, type: "mouseover"}, expectedEvent);

  broker.pass({'function':'MozMillElement.mouseOver()'});

  return true;
};

/**
 * Synthesize a mouse up event on the given element
 */
MozMillElement.prototype.mouseUp = function (button, left, top, expectedEvent) {
  this.mouseEvent(left, top, {button: button, type: "mouseup"}, expectedEvent);

  broker.pass({'function':'MozMillElement.mouseUp()'});

  return true;
};

/**
 * Synthesize a mouse middle click event on the given element
 */
MozMillElement.prototype.middleClick = function (left, top, expectedEvent) {
  this.mouseEvent(left, top, {button: 1}, expectedEvent);

  broker.pass({'function':'MozMillElement.middleClick()'});

  return true;
};

/**
 * Synthesize a mouse right click event on the given element
 */
MozMillElement.prototype.rightClick = function (left, top, expectedEvent) {
  this.mouseEvent(left, top, {type : "contextmenu", button: 2 }, expectedEvent);

  broker.pass({'function':'MozMillElement.rightClick()'});

  return true;
};

MozMillElement.prototype.waitForElement = function (timeout, interval) {
  var elem = this;

  utils.waitFor(function () {
    return elem.exists();
  }, "Timeout exceeded for waitForElement " + this.getInfo(), timeout, interval);

  broker.pass({'function':'MozMillElement.waitForElement()'});
};

MozMillElement.prototype.waitForElementNotPresent = function (timeout, interval) {
  var elem = this;

  utils.waitFor(function () {
    return !elem.exists();
  }, "Timeout exceeded for waitForElementNotPresent " + this.getInfo(), timeout, interval);

  broker.pass({'function':'MozMillElement.waitForElementNotPresent()'});
};

MozMillElement.prototype.waitThenClick = function (timeout, interval,
                                                   left, top, expectedEvent) {
  this.waitForElement(timeout, interval);
  this.click(left, top, expectedEvent);
};

// Dispatches an HTMLEvent
MozMillElement.prototype.dispatchEvent = function (eventType, canBubble, modifiers) {
  canBubble = canBubble || true;
  var evt = this.element.ownerDocument.createEvent('HTMLEvents');
  evt.shiftKey = modifiers["shift"];
  evt.metaKey = modifiers["meta"];
  evt.altKey = modifiers["alt"];
  evt.ctrlKey = modifiers["ctrl"];
  evt.initEvent(eventType, canBubble, true);

  this.element.dispatchEvent(evt);
};


//---------------------------------------------------------------------------------------------------------------------------------------


/**
 * MozMillCheckBox
 * Checkbox element, inherits from MozMillElement
 */
MozMillCheckBox.prototype = new MozMillElement();
MozMillCheckBox.prototype.parent = MozMillElement.prototype;
MozMillCheckBox.prototype.constructor = MozMillCheckBox;
function MozMillCheckBox(locatorType, locator, args) {
  this.parent.constructor.call(this, locatorType, locator, args);
}

// Static method returns true if node is this type of element
MozMillCheckBox.isType = function (node) {
  if ((node.localName.toLowerCase() == "input" && node.getAttribute("type") == "checkbox") ||
      (node.localName.toLowerCase() == 'toolbarbutton' && node.getAttribute('type') == 'checkbox') ||
      (node.localName.toLowerCase() == 'checkbox')) {
    return true;
  }

  return false;
};

/**
 * Enable/Disable a checkbox depending on the target state
 */
MozMillCheckBox.prototype.check = function (state) {
  var result = false;

  if (!this.element) {
    throw new Error("could not find element " + this.getInfo());
  }

  // If we have a XUL element, unwrap its XPCNativeWrapper
  if (this.element.namespaceURI == NAMESPACE_XUL) {
    this.element = utils.unwrapNode(this.element);
  }

  state = (typeof(state) == "boolean") ? state : false;
  if (state != this.element.checked) {
    this.click();
    var element = this.element;

    utils.waitFor(function () {
      return element.checked == state;
    }, "Checkbox " + this.getInfo() + " could not be checked/unchecked", 500);

    result = true;
  }

  broker.pass({'function':'MozMillCheckBox.check(' + this.getInfo() +
               ', state: ' + state + ')'});
  return result;
};

//----------------------------------------------------------------------------------------------------------------------------------------


/**
 * MozMillRadio
 * Radio button inherits from MozMillElement
 */
MozMillRadio.prototype = new MozMillElement();
MozMillRadio.prototype.parent = MozMillElement.prototype;
MozMillRadio.prototype.constructor = MozMillRadio;
function MozMillRadio(locatorType, locator, args) {
  this.parent.constructor.call(this, locatorType, locator, args);
}

// Static method returns true if node is this type of element
MozMillRadio.isType = function (node) {
  if ((node.localName.toLowerCase() == 'input' && node.getAttribute('type') == 'radio') ||
      (node.localName.toLowerCase() == 'toolbarbutton' && node.getAttribute('type') == 'radio') ||
      (node.localName.toLowerCase() == 'radio') ||
      (node.localName.toLowerCase() == 'radiogroup')) {
    return true;
  }

  return false;
};

/**
 * Select the given radio button
 *
 * index - Specifies which radio button in the group to select (only applicable to radiogroup elements)
 *         Defaults to the first radio button in the group
 */
MozMillRadio.prototype.select = function (index) {
  if (!this.element) {
    throw new Error("could not find element " + this.getInfo());
  }

  if (this.element.localName.toLowerCase() == "radiogroup") {
    var element = this.element.getElementsByTagName("radio")[index || 0];
    new MozMillRadio("Elem", element).click();
  } else {
    var element = this.element;
    this.click();
  }

  utils.waitFor(function () {
    // If we have a XUL element, unwrap its XPCNativeWrapper
    if (element.namespaceURI == NAMESPACE_XUL) {
      element = utils.unwrapNode(element);
      return element.selected == true;
    }

    return element.checked == true;
  }, "Radio button " + this.getInfo() + " could not be selected", 500);

  broker.pass({'function':'MozMillRadio.select(' + this.getInfo() + ')'});

  return true;
};

//----------------------------------------------------------------------------------------------------------------------------------------


/**
 * MozMillDropList
 * DropList inherits from MozMillElement
 */
MozMillDropList.prototype = new MozMillElement();
MozMillDropList.prototype.parent = MozMillElement.prototype;
MozMillDropList.prototype.constructor = MozMillDropList;
function MozMillDropList(locatorType, locator, args) {
  this.parent.constructor.call(this, locatorType, locator, args);
};

// Static method returns true if node is this type of element
MozMillDropList.isType = function (node) {
  if ((node.localName.toLowerCase() == 'toolbarbutton' && (node.getAttribute('type') == 'menu' || node.getAttribute('type') == 'menu-button')) ||
      (node.localName.toLowerCase() == 'menu') ||
      (node.localName.toLowerCase() == 'menulist') ||
      (node.localName.toLowerCase() == 'select' )) {
    return true;
  }

  return false;
};

/* Select the specified option and trigger the relevant events of the element */
MozMillDropList.prototype.select = function (indx, option, value) {
  if (!this.element){
    throw new Error("Could not find element " + this.getInfo());
  }

  //if we have a select drop down
  if (this.element.localName.toLowerCase() == "select"){
    var item = null;

    // The selected item should be set via its index
    if (indx != undefined) {
      // Resetting a menulist has to be handled separately
      if (indx == -1) {
        this.dispatchEvent('focus', false);
        this.element.selectedIndex = indx;
        this.dispatchEvent('change', true);

        broker.pass({'function':'MozMillDropList.select()'});

        return true;
      } else {
        item = this.element.options.item(indx);
      }
    } else {
      for (var i = 0; i < this.element.options.length; i++) {
        var entry = this.element.options.item(i);
        if (option != undefined && entry.innerHTML == option ||
            value != undefined && entry.value == value) {
          item = entry;
          break;
        }
      }
    }

    // Click the item
    try {
      // EventUtils.synthesizeMouse doesn't work.
      this.dispatchEvent('focus', false);
      item.selected = true;
      this.dispatchEvent('change', true);

      broker.pass({'function':'MozMillDropList.select()'});

      return true;
    } catch (e) {
      throw new Error("No item selected for element " + this.getInfo());
    }
  }
  //if we have a xul menupopup select accordingly
  else if (this.element.namespaceURI.toLowerCase() == NAMESPACE_XUL) {
    var ownerDoc = this.element.ownerDocument;
    // Unwrap the XUL element's XPCNativeWrapper
    this.element = utils.unwrapNode(this.element);
    // Get the list of menuitems
    menuitems = this.element.getElementsByTagName("menupopup")[0].getElementsByTagName("menuitem");

    var item = null;

    if (indx != undefined) {
      if (indx == -1) {
        this.dispatchEvent('focus', false);
        this.element.boxObject.QueryInterface(Ci.nsIMenuBoxObject).activeChild = null;
        this.dispatchEvent('change', true);

        broker.pass({'function':'MozMillDropList.select()'});

        return true;
      } else {
        item = menuitems[indx];
      }
    } else {
      for (var i = 0; i < menuitems.length; i++) {
        var entry = menuitems[i];
        if (option != undefined && entry.label == option ||
            value != undefined && entry.value == value) {
          item = entry;
          break;
        }
      }
    }

    // Click the item
    try {
      EventUtils.synthesizeMouse(this.element, 1, 1, {}, ownerDoc.defaultView);

      // Scroll down until item is visible
      for (var i = 0; i <= menuitems.length; ++i) {
        var selected = this.element.boxObject.QueryInterface(Ci.nsIMenuBoxObject).activeChild;
        if (item == selected) {
          break;
        }
        EventUtils.synthesizeKey("VK_DOWN", {}, ownerDoc.defaultView);
      }

      EventUtils.synthesizeMouse(item, 1, 1, {}, ownerDoc.defaultView);

      broker.pass({'function':'MozMillDropList.select()'});

      return true;
    } catch (e) {
      throw new Error('No item selected for element ' + this.getInfo());
    }
  }
};


//----------------------------------------------------------------------------------------------------------------------------------------


/**
 * MozMillTextBox
 * TextBox inherits from MozMillElement
 */
MozMillTextBox.prototype = new MozMillElement();
MozMillTextBox.prototype.parent = MozMillElement.prototype;
MozMillTextBox.prototype.constructor = MozMillTextBox;
function MozMillTextBox(locatorType, locator, args) {
  this.parent.constructor.call(this, locatorType, locator, args);
};

// Static method returns true if node is this type of element
MozMillTextBox.isType = function (node) {
  if ((node.localName.toLowerCase() == 'input' && (node.getAttribute('type') == 'text' || node.getAttribute('type') == 'search')) ||
      (node.localName.toLowerCase() == 'textarea') ||
      (node.localName.toLowerCase() == 'textbox')) {
    return true;
  }

  return false;
};

/**
 * Synthesize keypress events for each character on the given element
 *
 * @param {string} aText
 *        The text to send as single keypress events
 * @param {object} aModifiers
 *        Information about the modifier keys to send
 *        Elements: accelKey   - Hold down the accelerator key (ctrl/meta)
 *                               [optional - default: false]
 *                  altKey     - Hold down the alt key
 *                              [optional - default: false]
 *                  ctrlKey    - Hold down the ctrl key
 *                               [optional - default: false]
 *                  metaKey    - Hold down the meta key (command key on Mac)
 *                               [optional - default: false]
 *                  shiftKey   - Hold down the shift key
 *                               [optional - default: false]
 * @param {object} aExpectedEvent
 *        Information about the expected event to occur
 *        Elements: target     - Element which should receive the event
 *                               [optional - default: current element]
 *                  type       - Type of the expected key event
 */
MozMillTextBox.prototype.sendKeys = function (aText, aModifiers, aExpectedEvent) {
  if (!this.element) {
    throw new Error("could not find element " + this.getInfo());
  }

  var element = this.element;
  Array.forEach(aText, function (letter) {
    var win = element.ownerDocument ? element.ownerDocument.defaultView
                                    : element;
    element.focus();

    if (aExpectedEvent) {
      var target = aExpectedEvent.target ? aExpectedEvent.target.getNode()
                                         : element;
      EventUtils.synthesizeKeyExpectEvent(letter, aModifiers || {}, target,
                                          aExpectedEvent.type,
                                          "MozMillTextBox.sendKeys()", win);
    } else {
      EventUtils.synthesizeKey(letter, aModifiers || {}, win);
    }
  });

  broker.pass({'function':'MozMillTextBox.type()'});

  return true;
};
