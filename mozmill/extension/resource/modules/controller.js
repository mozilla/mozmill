// ***** BEGIN LICENSE BLOCK *****
// Version: MPL 1.1/GPL 2.0/LGPL 2.1
// 
// The contents of this file are subject to the Mozilla Public License Version
// 1.1 (the "License"); you may not use this file except in compliance with
// the License. You may obtain a copy of the License at
// http://www.mozilla.org/MPL/
// 
// Software distributed under the License is distributed on an "AS IS" basis,
// WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
// for the specific language governing rights and limitations under the
// License.
// 
// The Original Code is Mozilla Corporation Code.
// 
// The Initial Developer of the Original Code is
// Adam Christian.
// Portions created by the Initial Developer are Copyright (C) 2008
// the Initial Developer. All Rights Reserved.
// 
// Contributor(s):
//  Adam Christian <adam.christian@gmail.com>
//  Mikeal Rogers <mikeal.rogers@gmail.com>
// 
// Alternatively, the contents of this file may be used under the terms of
// either the GNU General Public License Version 2 or later (the "GPL"), or
// the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
// in which case the provisions of the GPL or the LGPL are applicable instead
// of those above. If you wish to allow use of your version of this file only
// under the terms of either the GPL or the LGPL, and not to allow others to
// use your version of this file under the terms of the MPL, indicate your
// decision by deleting the provisions above and replace them with the notice
// and other provisions required by the GPL or the LGPL. If you do not delete
// the provisions above, a recipient may use your version of this file under
// the terms of any one of the MPL, the GPL or the LGPL.
// 
// ***** END LICENSE BLOCK *****

var EXPORTED_SYMBOLS = ["MozMillController", "sleep", "waitForEval"];

var events = {}; Components.utils.import('resource://mozmill/modules/events.js', events);
var utils = {}; Components.utils.import('resource://mozmill/modules/utils.js', utils);
var elementslib = {}; Components.utils.import('resource://mozmill/modules/elementslib.js', elementslib);
var frame = {}; Components.utils.import('resource://mozmill/modules/frame.js', frame);

var hwindow = Components.classes["@mozilla.org/appshell/appShellService;1"]
                .getService(Components.interfaces.nsIAppShellService)
                .hiddenDOMWindow;

function sleep (milliseconds) {
  var self = {};

  // We basically just call this once after the specified number of milliseconds
  function wait() {
    self.timeup = true;
  }

  // Calls repeatedly every X milliseconds until clearInterval is called
  var interval = hwindow.setInterval(wait, milliseconds);

  var thread = Components.classes["@mozilla.org/thread-manager;1"]
            .getService()
            .currentThread;
  // This blocks execution until our while loop condition is invalidated.  Note
  // that you must use a simple boolean expression for the loop, a function call
  // will not work.
  while(!self.timeup)
    thread.processNextEvent(true);
  hwindow.clearInterval(interval);

  return true;
}

function waitForEval (expression, timeout, interval, subject) {
  if (interval == undefined) {
    interval = 100;
  }
  if (timeout == undefined) {
    timeout = 30000;
  }
  
  var self = {};
  self.counter = 0;
  self.result = eval(expression);
  
  function wait(){
    self.result = eval(expression);
    self.counter += interval;
  }
  
  var timeoutInterval = hwindow.setInterval(wait, interval);
  
  var thread = Components.classes["@mozilla.org/thread-manager;1"]
            .getService()
            .currentThread;
  
  while((self.result != true) && (self.counter < timeout))  {
    thread.processNextEvent(true);
  }  
  hwindow.clearInterval(timeoutInterval);
  
  return true;
}

function waitForElement(elem, timeout, interval) {
  if (interval == undefined) {
    interval = 100;
  }
  if (timeout == undefined) {
    timeout = 30000;
  }
  waitForEval('subject.exists()', timeout, interval, elem);
}

var Menu = function (elements) {
  for each(node in elements) {
    if (node.tagName == "menu") {
      this[node.getAttribute("label")] = new Menu(node.getElementsByTagName("menupopup")[0].childNodes);
    } else if (node.tagName == "menuitem") {
      this[node.getAttribute("label")] = node;
    } 
  }
}


var MozMillController = function (window) {
  // TODO: Check if window is loaded and block until it has if it hasn't.
  this.window = window;
  if ( window.document.documentElement != undefined ) {
    // waitForEval("typeof(subject.document.documentElement.getAttribute) == 'function'", 10000, 100, window)
    waitForEval("subject.document.documentElement.getAttribute('windowtype') != null", 10000, 100, window)
    if ( controllerAdditions[window.document.documentElement.getAttribute('windowtype')] != undefined ) {
      this.prototype = new utils.Copy(this.prototype);
      controllerAdditions[window.document.documentElement.getAttribute('windowtype')](this);
      this.windowtype = window.document.documentElement.getAttribute('windowtype');
    }
  }
  this.menus = new Menu(this.window.document.getElementsByTagName('menubar')[0].childNodes);
}
MozMillController.prototype.open = function(url){
  this.window.openLocation(url);
  var el = new elementslib.ID(this.window.document, 'urlbar').getNode();
  this.type(new elementslib.ID(this.window.document, 'urlbar'), url);
  events.triggerKeyEvent(el, 'keypress', '13', true, false, false, false,false); 
  frame.events.pass({'function':'Controller.open()'});
};
MozMillController.prototype.keypress = function(el, keycode, controlKeyDown, altKeyDown, shiftKeyDown, metaKeyDown){
  if (!controlKeyDown){
    var controlKeyDown = false;
  }
  if (!altKeyDown){
    var altKeyDown = false;
  }
  if (!shiftKeyDown){
    var shiftKeyDown = false
  }
  if (!metaKeyDown){
    var metaKeyDown = false;
  }
  
  var element = el.getNode();
  events.triggerKeyEvent(element, 'keypress', keycode, true, controlKeyDown, altKeyDown, shiftKeyDown, metaKeyDown);  
};

MozMillController.prototype.click = function(el){
    //this.window.focus();
    var element = el.getNode();
    if (!element){ 
      throw new Error("could not find element " + el.getInfo());     
      return false; 
    }     
    try { events.triggerEvent(element, 'focus', false); }
    catch(err){ }
    
    //launch the click on firefox chrome
    if (element.baseURI.indexOf('chrome://') != -1){
      element.click();
      frame.events.pass({'function':'Controller.click()'});
      return true;
    }

    // Add an event listener that detects if the default action has been prevented.
    // (This is caused by a javascript onclick handler returning false)
    // we capture the whole event, rather than the getPreventDefault() state at the time,
    // because we need to let the entire event bubbling and capturing to go through
    // before making a decision on whether we should force the href
    var savedEvent = null;
    element.addEventListener('click', function(evt) {
        savedEvent = evt;
    }, false);
    // Trigger the event.
    events.triggerMouseEvent(element, 'mousedown', true);
    events.triggerMouseEvent(element, 'mouseup', true);
    events.triggerMouseEvent(element, 'click', true);
    // Perform the link action if preventDefault was set.
    // In chrome URL, the link action is already executed by triggerMouseEvent.
    if (!utils.checkChrome && savedEvent != null && !savedEvent.getPreventDefault()) {
        if (element.href) {
            this.open(element.href);
        } 
        else {
            var itrElement = element;
            while (itrElement != null) {
              if (itrElement.href) {
                this.open(itrElement.href);
                break;
              }
              itrElement = itrElement.parentNode;
            }
        }
    }
    frame.events.pass({'function':'Controller.click()'});
    return true;    
};

MozMillController.prototype.sleep = sleep;
MozMillController.prototype.waitForEval = waitForEval;
MozMillController.prototype.waitForElement = waitForElement;

MozMillController.prototype.type = function (el, text){
  //this.window.focus();
  var element = el.getNode();
  if (!element){ 
    throw new Error("could not find element " + el.getInfo());     
    return false; 
  } 
  //clear the box
  element.value = '';
  //Get the focus on to the item to be typed in, or selected

  try {
    events.triggerEvent(element, 'focus', false);
    events.triggerEvent(element, 'select', true);
  }
  catch(err){}

  //Make sure text fits in the textbox
  var maxLengthAttr = element.getAttribute("maxLength");
  var actualValue = text;
  var stringValue = text;
   
  if (maxLengthAttr != null) {
    var maxLength = parseInt(maxLengthAttr);
    if (stringValue.length > maxLength) {
      //truncate it to fit
      actualValue = stringValue.substr(0, maxLength);
    }
  }

  var s = actualValue;
  for (var c = 0; c < s.length; c++){
    try {
      events.triggerKeyEvent(element, 'keydown', s.charAt(c), true, false,false, false,false);
    }catch(err){}
    element.value += s.charAt(c);
    try {
      events.triggerKeyEvent(element, 'keyup', s.charAt(c), true, false,false, false,false);
    } catch(err){};
  }
   
  // DGF this used to be skipped in chrome URLs, but no longer.  Is xpcnativewrappers to blame?
  //Another wierd chrome thing?
  try {
    events.triggerEvent(element, 'change', true);
  }catch(err){ }
   
  frame.events.pass({'function':'Controller.type()'});
  return true;
};

/* Select the specified option and trigger the relevant events of the element.*/
MozMillController.prototype.select = function (el) {
  //this.window.focus();
  element = el.getNode();
  if (!element){ 
    throw new Error("could not find element " + el.getInfo());     
    return false; 
  } 

 try{ events.triggerEvent(element, 'focus', false);}
 catch(err){};

 var optionToSelect = null;
 for (opt in element.options){
   var el = element.options[opt]

   if (param_object.option != undefined){
     if(el.innerHTML.indexOf(param_object.option) != -1){
       if (el.selected && el.options[opt] == optionToSelect){
         continue;
       }
       optionToSelect = el;
       optionToSelect.selected = true;
       events.triggerEvent(element, 'change', true);
       break;
     }
   }
   else{
      if(el.value.indexOf(param_object.value) != -1){
         if (el.selected && el.options[opt] == optionToSelect){
           continue;
         }
         optionToSelect = el;
         optionToSelect.selected = true;
         events.triggerEvent(element, 'change', true);
         break;
       }
   }
 }
 if (optionToSelect == null){
   throw new Error('optionsToSelect == null')
   return false;
 }
 frame.events.pass({'function':'Controller.select()'});
 return true;
};

//Directly access mouse events
MozMillController.prototype.mousedown = function (el){
  //this.window.focus();
  var mdnElement = el.getNode();
  events.triggerMouseEvent(mdnElement, 'mousedown', true);    
  frame.events.pass({'function':'Controller.mousedown()'});
  return true;
};

MozMillController.prototype.mouseup = function (el){
  //this.window.focus();
  var mupElement = el.getNode();
  events.triggerMouseEvent(mdnElement, 'mupElement', true);  
  frame.events.pass({'function':'Controller.mouseup()'});
  return true;
};

MozMillController.prototype.mouseover = function (el){
  //this.window.focus();
  var mdnElement = el.getNode();
  events.triggerMouseEvent(mdnElement, 'mouseover', true);  
  frame.events.pass({'function':'Controller.mouseover()'});
  return true;
};

MozMillController.prototype.mouseout = function (el){
  //this.window.focus();
  var moutElement = el.getNode();
  events.triggerMouseEvent(moutElement, 'mouseout', true);
  frame.events.pass({'function':'Controller.mouseout()'});
  return true;
};

//Browser navigation functions
MozMillController.prototype.goBack = function(){
  //this.window.focus();
  this.window.history.back();
  frame.events.pass({'function':'Controller.goBack()'});
  return true;
}
MozMillController.prototype.goForward = function(){
  //this.window.focus();
  this.window.history.forward();
  frame.events.pass({'function':'Controller.goForward()'});
  return true;
}
MozMillController.prototype.refresh = function(){
  //this.window.focus();
  this.window.location.reload(true);
  frame.events.pass({'function':'Controller.refresh()'});
  return true;
}

//there is a problem with checking via click in safari
MozMillController.prototype.check = function(el){
  //this.window.focus();
  var element = el.getNode();
  return MozMillController.click(element);    
}

//Radio buttons are even WIERDER in safari, not breaking in FF
MozMillController.radio = function(el){
  //this.window.focus();
  var element = el.getNode();
  return MozMillController.click(element);      
}

//Double click for Mozilla
MozMillController.prototype.doubleClick = function(el) {
   //this.window.focus();
   var element = element.getNode();
   if (!element){ 
    throw new Error("could not find element " + el.getInfo());     
    return false; 
   } 
   events.triggerEvent(element, 'focus', false);
   events.triggerMouseEvent(element, 'dblclick', true);
   events.triggerEvent(element, 'blur', false);
 
   frame.events.pass({'function':'Controller.doubleClick()'});
   return true;
};


MozMillController.prototype.assertText = function (el, text) {
  //this.window.focus();
  var n = el.getNode();
  var validator = text;
  try{
    if (n.innerHTML.indexOf(validator) != -1){ 
      frame.events.pass({'function':'Controller.assertText()'});
      return true; 
      }
    if (n.hasChildNodes()){
      for(var m = n.firstChild; m != null; m = m.nextSibling) {
        if (m.innerHTML.indexOf(validator) != -1){ 
          frame.events.pass({'function':'Controller.assertText()'});
          return true; 
          }
        if (m.value.indexOf(validator) != -1){ 
          frame.events.pass({'function':'Controller.assertText()'});
          return true; 
          }
      }
    }
  }
  catch(error){
    throw new Error("could not validate element " + el.getInfo()+" with text "+ text);
    return false;
  }
  throw new Error("could not validate element " + el.getInfo()+" with text "+ text);
  return false;
  
};

//Assert that a specified node exists
MozMillController.prototype.assertNode = function (el) {
  //this.window.focus();
  var element = el.getNode();
  if (!element){ 
    throw new Error("could not find element " + el.getInfo());     
    return false; 
  }
  frame.events.pass({'function':'Controller.assertNode()'});
  return true;
};

// Assert that a specified node doesn't exist
MozMillController.prototype.assertNodeNotExist = function (el) {
  //this.window.focus();
  var element = el.getNode();
  if (!element){ 
    frame.events.pass({'function':'Controller.assertNodeNotExist()'});
    return true; 
  }
  throw new Error("Unexpectedly found element " + el.getInfo());     
  return false;
};

//Assert that a form element contains the expected value
MozMillController.prototype.assertValue = function (el, value) {
  //this.window.focus();
  var n = el.getNode();
  var validator = value;

  if (n.value.indexOf(validator) != -1){
    frame.events.pass({'function':'Controller.assertValue()'});
    return true; 
    }
  throw new Error("could not validate element " + el.getInfo()+" with value "+ value);
  return false;
};

//Assert that a provided value is selected in a select element
MozMillController.prototype.assertJS = function (js) {
  //this.window.focus();
  var result = eval(js);
  if (result){ 
    frame.events.pass({'function':'Controller.assertJS()'});
    return result; 
  }
  
  else{ 
    throw new Error("javascript assert was not succesful"); 
    return result;}
};

//Assert that a provided value is selected in a select element
MozMillController.prototype.assertSelected = function (el, value) {
  //this.window.focus();
  var n = el.getNode();
  var validator = value;

  if (n.options[n.selectedIndex].value == validator){ 
    frame.events.pass({'function':'Controller.assertSelected()'});
    return true; 
    }
  throw new Error("could not assert value for element " + el.getInfo()+" with value "+ value);
  return false;
};

//Assert that a provided checkbox is checked
MozMillController.prototype.assertChecked = function (el) {
  //this.window.focus();
  var n = el.getNode();

  if (n.checked == true){ 
    frame.events.pass({'function':'Controller.assertChecked()'});
    return true; 
    }
  throw new Error("assert failed for checked element " + el.getInfo());
  return false;
};

// Assert that a an element's property is a particular value
MozMillController.prototype.assertProperty = function(el, attrib, val) {
  var element = el.getNode();
  if (!element){
    throw new Error("could not find element " + el.getInfo());     
    return false;
  }
  var value = eval ('element.' + attrib+';');
  var res = false;
  try {
    if (value.indexOf(val) != -1){
      res = true;
    }
  }
  catch(err){
  }
  if (String(value) == String(val)) {
    res = true;
  }
  if (res) {
    frame.events.pass({'function':'Controller.assertProperty()'});
  } else {
    throw new Error('Controller.assertProperty() failed');
  }
  
  return res;
};

// Assert that a specified image has actually loaded
// The Safari workaround results in additional requests
// for broken images (in Safari only) but works reliably
MozMillController.prototype.assertImageLoaded = function (el) {
  //this.window.focus();
  var img = el.getNode();
  if (!img || img.tagName != 'IMG') {
    throw new Error('Controller.assertImageLoaded() failed.')
    return false;
  }
  var comp = img.complete;
  var ret = null; // Return value

  // Workaround for Safari -- it only supports the
  // complete attrib on script-created images
  if (typeof comp == 'undefined') {
    test = new Image();
    // If the original image was successfully loaded,
    // src for new one should be pulled from cache
    test.src = img.src;
    comp = test.complete;
  }

  // Check the complete attrib. Note the strict
  // equality check -- we don't want undefined, null, etc.
  // --------------------------
  // False -- Img failed to load in IE/Safari, or is
  // still trying to load in FF
  if (comp === false) {
    ret = false;
  }
  // True, but image has no size -- image failed to
  // load in FF
  else if (comp === true && img.naturalWidth == 0) {
    ret = false;
  }
  // Otherwise all we can do is assume everything's
  // hunky-dory
  else {
    ret = true;
  }
  if (ret) {
    frame.events.pass({'function':'Controller.assertImageLoaded'});
  } else {
    throw new Error('Controller.assertImageLoaded() failed.')
  }
  
  return ret;
};

//Drag one eleent to the top x,y coords of another specified element
MozMillController.prototype.mouseMove = function (doc, start, dest) {
  //if one of these elements couldn't be looked up
  if (typeof start != 'object'){
    throw new Error("received bad coordinates");     
    return false;
  }
  if (typeof dest != 'object'){
    throw new Error("received bad coordinates");     
    return false;
  }
    
  //Do the initial move to the drag element position
  events.triggerMouseEvent(doc.body, 'mousemove', true, start[0], start[1]);
  events.triggerMouseEvent(doc.body, 'mousemove', true, dest[0], dest[1]);  
  frame.events.pass({'function':'Controller.mouseMove()'});
  return true;
}

//Drag one eleent to the top x,y coords of another specified element
MozMillController.prototype.dragDropElemToElem = function (dstart, ddest) {
  //Get the drag and dest
  var drag = dstart.getNode();
  var dest = ddest.getNode();
  
  //if one of these elements couldn't be looked up
  if (!drag){
    throw new Error("could not find element " + drag.getInfo());     
    return false;
  }
  if (!dest){
    throw new Error("could not find element " + dest.getInfo());     
    return false;
  }
 
  var dragCoords = null;
  var destCoords = null; 

  dragCoords = drag.getBoundingClientRect();
  destCoords = dest.getBoundingClientRect();
    
  //Do the initial move to the drag element position
  events.triggerMouseEvent(drag.ownerDocument.body, 'mousemove', true, dragCoords.left, dragCoords.top);
  events.triggerMouseEvent(drag, 'mousedown', true, dragCoords.left, dragCoords.top); //do the mousedown
  events.triggerMouseEvent(drag.ownerDocument.body, 'mousemove', true, destCoords.left, destCoords.top); 
  events.triggerMouseEvent(dest, 'mouseup', true, destCoords.left, destCoords.top);
  events.triggerMouseEvent(dest, 'click', true, destCoords.left, destCoords.top);
  frame.events.pass({'function':'Controller.dragDropElemToElem()'});
  return true;
}

function preferencesAdditions(controller) {
  var mainTabs = controller.window.document.getAnonymousElementByAttribute(controller.window.document.documentElement, 'anonid', 'selector');
  controller.tabs = {};
  for (var i = 0; i < mainTabs.childNodes.length; i++) {
    var node  = mainTabs.childNodes[i];
    obj = {'button':node}
    controller.tabs[i] = obj;
    var label = node.attributes.item('label').value.replace('pane', '');
    controller.tabs[label] = obj;
  }
  controller.prototype.__defineGetter__("activeTabButton", 
    function () {return mainTabs.getElementsByAttribute('selected', true)[0]; 
  })
}

function Tabs (controller) {
  this.controller = controller;
}
Tabs.prototype.getTab = function(index) {
  return this.controller.window.gBrowser.browsers[index + 1].contentDocument;
}
Tabs.prototype.__defineGetter__("activeTab", function() {
  return this.controller.window.gBrowser.selectedBrowser.contentDocument;
})
Tabs.prototype.selectTab = function(index) {
  // GO in to tab manager and grab the tab by index and call focus.
}


function browserAdditions( controller ) {
  controller.tabs = new Tabs(controller);
  controller.waitForPageLoad = function(_document, timeout, interval) {
    if (interval == undefined) {
      interval = 100;
    }
    if (timeout == undefined) {
      timeout = 30000;
    }    
    waitForEval("subject.body.style != undefined", timeout, interval, _document);
    //Once the object is available it's somewhere between 1 and 3 seconds before the DOM
    //Actually becomes available to us
    sleep(3000);
  }
}

controllerAdditions = {
  'Browser:Preferences':preferencesAdditions,
  'navigator:browser'  :browserAdditions,
}