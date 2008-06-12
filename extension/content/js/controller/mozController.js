/*
Copyright 2006-2007, Open Source Applications Foundation

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

//Click function for Mozilla with Chrome
mozmill.controller.click = function(param_object){  
    var element = this._lookupDispatch(param_object);
    if (typeof element == "undefined"){ return false; }     
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
      if (!browser.isChrome && savedEvent != null && !savedEvent.getPreventDefault()) {
          if (element.href) {
              //mozmill.xhr.loopState = false;
              mozmill.controller.open({"url": element.href});
          } 
          else {
              var itrElement = element;
              while (itrElement != null) {
                if (itrElement.href) {
                  //mozmill.xhr.loopState = false;
                  mozmill.controller.open({"url": itrElement.href});
                  break;
                }
                itrElement = itrElement.parentNode;
              }
          }
      }
    }
    catch(err){
      mozmill.ui.results.writeResult(err);
    }
  return true;    
};

//there is a problem with checking via click in safari
mozmill.controller.check = function(param_object){
  return mozmill.controller.click(param_object);    
}

//Radio buttons are even WIERDER in safari, not breaking in FF
mozmill.controller.radio = function(param_object){
  return mozmill.controller.click(param_object);      
}

//Double click for Mozilla
mozmill.controller.doubleClick = function(param_object) {

 //Look up the dom element, return false if its not there so we can report failure
 var element = this._lookupDispatch(param_object);
 if (!element){
    return false;
 }
    
 mozmill.events.triggerEvent(element, 'focus', false);

 // Trigger the mouse event.
 mozmill.events.triggerMouseEvent(element, 'dblclick', true);

 /*if (this._windowClosed()) {
     return;
 }*/

 mozmill.events.triggerEvent(element, 'blur', false);
 
 return true;
};

/**
 * In non-IE browsers, getElementById() does not search by name.  Instead, we
 * we search separately by id and name.
 */
mozmill.controller.locateElementByIdentifier = function(identifier, inDocument, inWindow) {
  return mozmill.controller.locateElementById(identifier, inDocument, inWindow)
  || mozmill.controller.locateElementByName(identifier, inDocument, inWindow)
  || null;
};
