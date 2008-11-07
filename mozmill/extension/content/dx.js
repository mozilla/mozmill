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

//Recorder Functionality
//*********************************/

var inspection = {}; Components.utils.import('resource://mozmill/modules/inspection.js', inspection);
var utils = {}; Components.utils.import('resource://mozmill/modules/utils.js', utils);

var DomInspectorConnector = function() {
  this.lastEvent = null;
}
DomInspectorConnector.prototype.grab = function(){
  var disp = $('dxDisplay').textContent;
  var dispArr = disp.split(': ');
  $('editorInput').value += 'new elementslib.'+dispArr[0].toUpperCase()+"('"+dispArr[1]+"')\n";
}  
DomInspectorConnector.prototype.evtDispatch = function(e) {
  var i = inspection.inspectElement(e);
  displayText = 'Controller: '+e.controllerText+'\n';
  displayText += 'Element   : '+e.elementText+'\n';
  displayText += 'Validation: '+String(e.validation)+'\n';
  $('dxDisplay').value = displayText;
}
DomInspectorConnector.prototype.dxToggle = function(){
  if ($('domExplorer').getAttribute('label') ==  'Disable Inspector'){
    this.dxOff();
  }
  else{
    this.dxOn();
  }
}
//Turn on the recorder
//Since the click event does things like firing twice when a double click goes also
//and can be obnoxious im enabling it to be turned off and on with a toggle check box
DomInspectorConnector.prototype.dxOn = function() {
  $('eventsOut').value = "";
  $('inspectClickSelection').disabled = true;
  $('domExplorer').setAttribute('label', 'Disable Inspector');
  //defined the click method, default to dblclick
  var clickMethod = "dblclick";
  if ($('inspectSingle').selected){
    clickMethod = 'click';
  }
  $('dxContainer').style.display = "block";
  //var w = Components.classes['@mozilla.org/appshell/window-mediator;1'].getService(Components.interfaces.nsIWindowMediator).getMostRecentWindow('');
  var enumerator = Components.classes["@mozilla.org/appshell/window-mediator;1"]
                     .getService(Components.interfaces.nsIWindowMediator)
                     .getEnumerator("");
  while(enumerator.hasMoreElements()) {
    var win = enumerator.getNext();
    //if (win.title != 'Error Console' && win.title != 'MozMill IDE'){
    if (win.title != 'MozMill IDE'){
      this.dxRecursiveBind(win, clickMethod);
      win.focus();
    }
  }
}
DomInspectorConnector.prototype.dxOff = function() {
  $('inspectClickSelection').disabled = false;

  //try to cleanup left over outlines
  if (this.lastEvent){
    this.lastEvent.target.style.border = "";
  }
  
  //defined the click method, default to dblclick
  var clickMethod = "dblclick";
  if ($('inspectSingle').selected){
    clickMethod = 'click';
  }
  
  //because they share this box
  var copyOutputBox = $('copyout');
  $('domExplorer').setAttribute('label', 'Enable Inspector');
  //$('dxContainer').style.display = "none";
  //var w = Components.classes['@mozilla.org/appshell/window-mediator;1'].getService(Components.interfaces.nsIWindowMediator).getMostRecentWindow('');
  for each(win in utils.getWindows()) {
    this.dxRecursiveUnBind(win, clickMethod);
  }
}
DomInspectorConnector.prototype.getFoc = function(e){
  disableDX();
  e.target.style.border = "";
  e.stopPropagation();
  e.preventDefault();
  window.focus();
}
//Copy inspector output to clipboard if alt,shift,c is pressed
DomInspectorConnector.prototype.clipCopy = function(e){
   if (e.altKey && e.shiftKey && (e.charCode == 199)){
       copyToClipboard($('dxDisplay').value);
   }
   else {
     $('eventsOut').value += "-----\n";
     $('eventsOut').value += "Shift Key: "+ e.shiftKey + "\n";
     $('eventsOut').value += "Control Key: "+ e.ctrlKey + "\n";
     $('eventsOut').value += "Alt Key: "+ e.altKey + "\n";
     $('eventsOut').value += "Meta Key: "+ e.metaKey + "\n\n";
     
     var ctrlString = "";
     ctrlString += MozMilldx.evtDispatch(e);
     ctrlString += "Controller: controller.keypress(element,"+e.charCode+",";
     ctrlString += e.ctrlKey.toString()+",";
     ctrlString += e.altKey.toString()+",";
     ctrlString += e.shiftKey.toString()+",";
     ctrlString += e.metaKey.toString()+");\n";
     
     ctrlString = ctrlString.replace(/undefined/g, "false");         
     $('eventsOut').value += ctrlString;
   }
}
//Recursively bind to all the iframes and frames within
DomInspectorConnector.prototype.dxRecursiveBind = function(frame, clickMethod) {
  //Make sure we haven't already bound anything to this frame yet
  this.dxRecursiveUnBind(frame, clickMethod);
  
  frame.addEventListener('mouseover', this.evtDispatch, true);
  frame.addEventListener('mouseout', this.evtDispatch, true);
  frame.addEventListener(clickMethod, this.getFoc, true);
  frame.addEventListener('keypress', this.clipCopy, true);
  
  
  var iframeCount = frame.window.frames.length;
  var iframeArray = frame.window.frames;

  for (var i = 0; i < iframeCount; i++)
  {
      try {
        iframeArray[i].addEventListener('mouseover', this.evtDispatch, true);
        iframeArray[i].addEventListener('mouseout', this.evtDispatch, true);
        iframeArray[i].addEventListener(clickMethod, this.getFoc, true);
        iframeArray[i].addEventListener('keypress', this.clipCopy, true);
        

        this.dxRecursiveBind(iframeArray[i], clickMethod);
      }
      catch(error) {
          //mozmill.results.writeResult('There was a problem binding to one of your iframes, is it cross domain?' + 
          //'Binding to all others.' + error);

      }
  }
}
//Recursively bind to all the iframes and frames within
DomInspectorConnector.prototype.dxRecursiveUnBind = function(frame, clickMethod) {
  frame.removeEventListener('mouseover', this.evtDispatch, true);
  frame.removeEventListener('mouseout', this.evtDispatch, true);
  frame.removeEventListener(clickMethod, this.getFoc, true);
  frame.removeEventListener('keypress', this.clipCopy, true);
  
  
  var iframeCount = frame.window.frames.length;
  var iframeArray = frame.window.frames;

  for (var i = 0; i < iframeCount; i++)
  {
      try {
        iframeArray[i].removeEventListener('mouseover', this.evtDispatch, true);
        iframeArray[i].removeEventListener('mouseout', this.evtDispatch, true);
        iframeArray[i].removeEventListener(clickMethod, this.getFoc, true);
        iframeArray[i].removeEventListener('keypress', this.clipCopy, true);

        this.dxRecursiveUnBind(iframeArray[i], clickMethod);
      }
      catch(error) {
          //mozmill.results.writeResult('There was a problem binding to one of your iframes, is it cross domain?' + 
          //'Binding to all others.' + error);
      }
  }
}

var MozMilldx = new DomInspectorConnector();

// Scoping bug workarounds
var enableDX = function () {
  MozMilldx.dxOn();
}
var disableDX = function () {
  MozMilldx.dxOff();
}