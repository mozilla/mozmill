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

var EXPORTED_SYMBOLS = ["MozMillController"];


var MozMillController = function (window) {
  // TODO: Check if window is loaded and block until it has if it hasn't.
  this.window = window;
}

MozMillController.prototype.open = function(s){
  mozmill.hiddenWindow.Application.browser.open(s).active = true;
  return true;
}

MozMillController.prototype.sleep = function (milliseconds) { 
  var observer = {
    QueryInterface : function (iid) {
      const interfaces = [Components.interfaces.nsIObserver,
                          Components.interfaces.nsISupports,
                          Components.interfaces.nsISupportsWeakReference];

      if (!interfaces.some( function(v) { return iid.equals(v) } ))
        throw Components.results.NS_ERROR_NO_INTERFACE;
      return this;
    },

    observe : function (subject, topic, data) {
      return true;
    }
  };

  var timer = Components.classes["@mozilla.org/timer;1"]
              .createInstance(Components.interfaces.nsITimer);
  timer.init(observer, milliseconds,
             Components.interfaces.nsITimer.TYPE_ONE_SHOT);
};

MozMillController.prototype.type = function (element, text){
  if (!element){ return false; }
  //clear the box
  element.value = '';
  //Get the focus on to the item to be typed in, or selected
  mozmill.events.triggerEvent(element, 'focus', false);
  mozmill.events.triggerEvent(element, 'select', true);
   
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
    mozmill.events.triggerKeyEvent(element, 'keydown', s.charAt(c), true, false,false, false,false);
    element.value += s.charAt(c);
    mozmill.events.triggerKeyEvent(element, 'keyup', s.charAt(c), true, false,false, false,false);
  }
   
  // DGF this used to be skipped in chrome URLs, but no longer.  Is xpcnativewrappers to blame?
  //Another wierd chrome thing?
  mozmill.events.triggerEvent(element, 'change', true);
   
  return true;
};


/* Select the specified option and trigger the relevant events of the element.*/
MozMillController.prototype.select = function (element) {
  if (!element){ return false; }
    
  var locatorType = param_object.locatorType || 'LABEL';
  /*if (!("options" in element)) {
  //throw new WindmillError("Specified element is not a Select (has no options)");
         
  }*/
  
  var locator = this.optionLocatorFactory.fromLocatorString(
                             locatorType.toLowerCase() + '=' + param_object.option);

  var optionToSelect = locator.findOption(element);
  
  mozmill.events.triggerEvent(element, 'focus', false);
  var changed = false;
  for (var i = 0; i < element.options.length; i++) {
    var option = element.options[i];
    if (option.selected && option != optionToSelect) {        
      option.selected = false;
      changed = true;
    }
    else if (!option.selected && option == optionToSelect) {        
      option.selected = true;
      changed = true;        
    }
  }


  if (changed) {
    mozmill.events.triggerEvent(element, 'change', true);
  }
  return true;
};

//Directly access mouse events
MozMillController.prototype.mousedown = function (mdnElement){
  mozmill.events.triggerMouseEvent(mdnElement, 'mousedown', true);    
  return true;
};

MozMillController.prototype.mouseup = function (mupElement){
  mozmill.events.triggerMouseEvent(mdnElement, 'mupElement', true);  
  return true;
};

MozMillController.prototype.mouseover = function (mdnElement){
  mozmill.events.triggerMouseEvent(mdnElement, 'mouseover', true);  
  return true;
};

MozMillController.prototype.mouseout = function (moutElement){
  mozmill.events.triggerMouseEvent(moutElement, 'mouseout', true);
  return true;
};

//Browser navigation functions
MozMillController.prototype.goBack = function(param_object){
  mozmill.testWindow.history.back();
  return true;
}
MozMillController.prototype.goForward = function(param_object){
  mozmill.testWindow.history.forward();
  return true;
}
MozMillController.prototype.refresh = function(param_object){
  mozmill.testWindow.location.reload(true);
  return true;
}

MozMillController.prototype.open = function(s){
  this.win.location.href=s;
  return true;
}

MozMillController.prototype.click = function(element){
    if (!element){ return false; }     
    mozmill.events.triggerEvent(element, 'focus', false);

    //launch the click on firefox chrome
    if (element.baseURI.indexOf('chrome://') != -1){
      element.click();
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
    mozmill.events.triggerMouseEvent(element, 'mousedown', true);
    mozmill.events.triggerMouseEvent(element, 'mouseup', true);
    mozmill.events.triggerMouseEvent(element, 'click', true);
    try{      
      // Perform the link action if preventDefault was set.
      // In chrome URL, the link action is already executed by triggerMouseEvent.
      if (!mozmill.utils.checkChrome && savedEvent != null && !savedEvent.getPreventDefault()) {
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
    }
    catch(err){ return false; }
    return true;    
};

//there is a problem with checking via click in safari
MozMillController.prototype.check = function(element){
  return MozMillController.click(element);    
}

//Radio buttons are even WIERDER in safari, not breaking in FF
MozMillController.radio = function(element){
  return MozMillController.click(element);      
}

//Double click for Mozilla
MozMillController.prototype.doubleClick = function(element) {

 if (!element){ return false; }
 mozmill.events.triggerEvent(element, 'focus', false);
 mozmill.events.triggerMouseEvent(element, 'dblclick', true);
 mozmill.events.triggerEvent(element, 'blur', false);
 
 return true;
};

asserts_lib = Components.utils.import('resource://mozmill/modules/asserts.js')

for (name in asserts_lib) {
  if (name != 'EXPORTED_SYMBOLS' && name != '_AssertFactory' && name != 'assertRegistry')
  MozMillController.prototype[name] = asserts_lib[name];
  }

MozMillController.prototype.assertText = function (param_object) {

  var n = mozmill.MozMillController._lookupDispatch(param_object);
  var validator = param_object.validator;
  try{
    if (n.innerHTML.indexOf(validator) != -1){
      return true;
    }
    if (n.hasChildNodes()){
      for(var m = n.firstChild; m != null; m = m.nextSibling) {
 if (m.innerHTML.indexOf(validator) != -1){
   return true;
 }
 if (m.value.indexOf(validator) != -1){
   return true;
 }
      }
    }
  }
  catch(error){
    return false;
  }
  return false;
};

//Assert that a specified node exists
MozMillController.prototype.assertNode = function (param_object) {
  var element = mozmill.MozMillController._lookupDispatch(param_object);
  if (!element){
    return false;
  }
  return true;
};

//Assert that a form element contains the expected value
MozMillController.prototype.assertValue = function (param_object) {
  var n = mozmill.MozMillController._lookupDispatch(param_object);
  var validator = param_object.validator;

  if (n.value.indexOf(validator) != -1){
    return true;
  }
  return false;
};

//Assert that a provided value is selected in a select element
MozMillController.prototype.assertJS = function (param_object) {
  var js = param_object.js;
  var result = eval(js);
  return result;
};

//Assert that a provided value is selected in a select element
MozMillController.prototype.assertSelected = function (param_object) {
  var n = mozmill.MozMillController._lookupDispatch(param_object);
  var validator = param_object.validator;

  if (n.options[n.selectedIndex].value == validator){
    return true;
  }
  return false;
};

//Assert that a provided checkbox is checked
MozMillController.prototype.assertChecked = function (param_object) {
  var n = mozmill.MozMillController._lookupDispatch(param_object);

  if (n.checked == true){
    return true;
  }
  return false;
};

// Assert that a an element's property is a particular value
MozMillController.prototype.assertProperty = function (param_object) {
  var element = mozmill.MozMillController._lookupDispatch(param_object);
  if (!element){
    return false;
  }
  var vArray = param_object.validator.split('|');
  var value = eval ('element.' + vArray[0]+';');
  var res = false;
  try {
    if (value.indexOf(vArray[1]) != -1){
      res = true;
    }
  }
  catch(err){
  }
  if (String(value) == String(vArray[1])) {
    res = true;
  }
  return res;
};

// Assert that a specified image has actually loaded
// The Safari workaround results in additional requests
// for broken images (in Safari only) but works reliably
MozMillController.prototype.assertImageLoaded = function (param_object) {
  var img = mozmill.MozMillController._lookupDispatch(param_object);
  if (!img || img.tagName != 'IMG') {
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
  return ret;
};

