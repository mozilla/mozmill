mozmill.MozMillController.prototype.type = function (element, text){

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
mozmill.MozMillController.prototype.select = function (element) {
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
mozmill.MozMillController.prototype.mousedown = function (mdnElement){
  mozmill.events.triggerMouseEvent(mdnElement, 'mousedown', true);    
  return true;
};

mozmill.MozMillController.prototype.mouseup = function (mupElement){
  mozmill.events.triggerMouseEvent(mdnElement, 'mupElement', true);  
  return true;
};

mozmill.MozMillController.prototype.mouseover = function (mdnElement){
  mozmill.events.triggerMouseEvent(mdnElement, 'mouseover', true);  
  return true;
};

mozmill.MozMillController.prototype.mouseout = function (moutElement){
  mozmill.events.triggerMouseEvent(moutElement, 'mouseout', true);
  return true;
};

//Browser navigation functions
mozmill.MozMillController.prototype.goBack = function(param_object){
  mozmill.testWindow.history.back();
  return true;
}
mozmill.MozMillController.prototype.goForward = function(param_object){
  mozmill.testWindow.history.forward();
  return true;
}
mozmill.MozMillController.prototype.refresh = function(param_object){
  mozmill.testWindow.location.reload(true);
  return true;
}

mozmill.MozMillController.prototype.open = function(s){
  this.win.location.href=s;
  return true;
}

mozmill.MozMillController.prototype.click = function(element){  
    if (element == undefined){ return false; }     
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
mozmill.MozMillController.prototype.check = function(element){
  return mozmill.controller.click(element);    
}

//Radio buttons are even WIERDER in safari, not breaking in FF
mozmill.controller.radio = function(element){
  return mozmill.controller.click(element);      
}

//Double click for Mozilla
mozmill.MozMillController.prototype.doubleClick = function(element) {

 if (!element){ return false; }
 mozmill.events.triggerEvent(element, 'focus', false);
 mozmill.events.triggerMouseEvent(element, 'dblclick', true);
 mozmill.events.triggerEvent(element, 'blur', false);
 
 return true;
};
