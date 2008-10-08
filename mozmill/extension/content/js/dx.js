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

var arrays = {}; Components.utils.import('resource://mozmill/stdlib/arrays.js', arrays);
var elementslib = {}; Components.utils.import('resource://mozmill/modules/elementslib.js', elementslib);
var dom = {}; Components.utils.import('resource://mozmill/stdlib/dom.js', dom);
var objects = {}; Components.utils.import('resource://mozmill/stdlib/objects.js', objects);
var json2 = {}; Components.utils.import('resource://mozmill/stdlib/json2.js', json2);
var r = {}; Components.utils.import('resource://mozmill/modules/results.js', r);

var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
           .getService(Components.interfaces.nsIWindowMediator);

var dprint = r.write;

var isNotAnonymous = function (elem, result) {
  if (result == undefined) {
    var result = true;
  }
  if ( elem.parentNode ) {
    var p = elem.parentNode;
    return isNotAnonymous(p, result == arrays.inArray(p.childNodes, elem) == true);
  } else {
    return result;
  }
}

var elemIsAnonymous = function (elem) {
  if (elem.getAttribute('anonid') || !arrays.inArray(elem.parentNode.childNodes, elem)) {
    return true;
  }
  return false;
}

var getDocument = function (elem) {
  while (elem.parentNode) {
    var elem = elem.parentNode;
  }
  return elem;
}

var attributeToIgnore = ['focus', 'focused', 'selected', 'select', 'flex', // General Omissions
                         'linkedpanel', 'last-tab', 'afterselected', // From Tabs UI, thanks Farhad
                         'style', // Gets set dynamically all the time, also effected by dx display code
                         ];

var getUniqueAttributesReduction = function (attributes, node) {
  for (i in attributes) {
    if ( node.getAttribute(i) == attributes[i] || arrays.inArray(attributeToIgnore, i) || arrays.inArray(attributeToIgnore, attributes[i])) {
      delete attributes[i];
    } 
  }
  
  return attributes;
}

var getLookupExpression = function (_document, elem) {
  expArray = [];
  while ( elem.parentNode ) {
    var exp = getLookupForElem(_document, elem);
    expArray.push(exp);
    var elem = elem.parentNode;
  }
  expArray.reverse();
  return '/' + expArray.join('/');
}

var getLookupForElem = function (_document, elem) {
  if ( !elemIsAnonymous(elem) ) {
    if (elem.id != "") {  
      identifier = {'name':'id', 'value':elem.id};
    } else if ((elem.name != "") && (typeof(elem.name) != "undefined")) {
      identifier = {'name':'name', 'value':elem.name};
    } else {
      identifier = null;
    }
    
    if (identifier) {
      var result = {'id':elementslib._byID, 'name':elementslib._byName}[identifier.name](_document, elem.parentNode, identifier.value);
      if ( typeof(result != 'array') ) {
        return identifier.name+'('+json2.JSON.stringify(identifier.value)+')';
      }
    }
    
    // At this point there is either no identifier or it returns multiple
    var parse = [n for each (n in elem.parentNode.childNodes) if 
                 (n.getAttribute && n != elem)
                 ];
    parse.unshift(dom.getAttributes(elem));
    var uniqueAttributes = parse.reduce(getUniqueAttributesReduction);
    
    if (!result) {
      var result = elementslib._byAttrib(elem.parentNode, uniqueAttributes);  
    } 
    
    if (!identifier && typeof(result) == 'array' ) {
      return json2.JSON.stringify(uniqueAttributes) + '['+arrays.indexOf(result, elem)+']'
    } else {
      var aresult = elementslib._byAttrib(elem.parentNode, uniqueAttributes);
      if ( typeof(aresult != 'array') ) {
        if (objects.getLength(uniqueAttributes) == 0) {
          return '['+arrays.indexOf(elem.parentNode.childNodes, elem)+']'
        }
        return json2.JSON.stringify(uniqueAttributes)
      } else if ( result.length > aresult.length ) {
        return json2.JSON.stringify(uniqueAttributes) + '['+arrays.indexOf(aresult, elem)+']'
      } else {
        return identifier.name+'('+json2.JSON.stringify(identifier.value)+')' + '['+arrays.indexOf(result, elem)+']'
      }
    }
    
  } else {
    // Handle Anonymous Nodes
    var parse = [n for each (n in _document.getAnonymousNodes(elem.parentNode)) if 
                 (n.getAttribute && n != elem)
                 ];
    parse.unshift(dom.getAttributes(elem));
    var uniqueAttributes = parse.reduce(getUniqueAttributesReduction);
    if (uniqueAttributes.anonid && typeof(elementslib._byAnonAttrib(_document, 
        elem.parentNode, {'anonid':uniqueAttributes.anonid})) != 'array') {
      uniqueAttributes = {'anonid':uniqueAttributes.anonid};
    }
    
    if (objects.getLength(uniqueAttributes) == 0) {
      return 'anon(['+arrays.indexOf(_document.getAnonymousNodes(elem.parentNode), elem)+'])';
    } else if (arrays.inArray(uniqueAttributes, 'anonid')) {
      return 'anon({"anonid":"'+uniqueAttributes['anonid']+'"})';
    } else {
      return 'anon('+json2.JSON.stringify(uniqueAttributes)+')';
    }    
    
  }
  return 'broken '+elemIsAnonymous(elem)
}

var removeHTMLTags = function(str){
 	 	str = str.replace(/&(lt|gt);/g, function (strMatch, p1){
 		 	return (p1 == "lt")? "<" : ">";
 		});
 		var strTagStrippedText = str.replace(/<\/?[^>]+(>|$)/g, "");
 		strTagStrippedText = strTagStrippedText.replace(/&nbsp;/g,"");
	return strTagStrippedText;
}

var isMagicAnonymousDiv = function (_document, node) {
  if (node.getAttribute && node.getAttribute('class') == 'anonymous-div') {
    if (!arrays.inArray(node.parentNode.childNodes, node) && (_document.getAnonymousNodes(node) == null || 
        !arrays.inArray(_document.getAnonymousNodes(node), node) ) ) {
          return true;
        }
  }
  return false;
}

var turnDXOff = function(){
  MozMilldx.dxOff();
}
var turnDXOn = function(){
  MozMilldx.dxOn();
}

var copyToClipboard = function(str){
  const gClipboardHelper = Components.classes["@mozilla.org/widget/clipboardhelper;1"] .getService(Components.interfaces.nsIClipboardHelper); 
  gClipboardHelper.copyString(str);
}

var getControllerAndDocument = function (_document, windowtype) {
  if (windowtype == null || windowtype == 'navigator:browser') {
    var c = mozmill.getBrowserController();
    if (c.tabs.activeTab == _document) {
      return {'controllerString':'mozmill.getBrowserController()',
              'documentString'  :'controller.tabs.activeTab',}
    } 
  }  
  var controllerString = null;
  var w = null;
  
  if (windowtype == null || windowtype == '') {
    var windowtype = wm.getMostRecentWindow('').document.documentElement.getAttribute('windowtype');
  } 
  
  // TODO replace with object based cases
  if (windowtype == 'navigator:browser') {
    var w = wm.getMostRecentWindow('navigator:browser');
    controllerString = 'controller = mozmill.getBrowserController()'
  } else if (windowtype == 'Browser:Preferences') {
    var w = wm.getMostRecentWindow('Browser:Preferences');
    controllerString = 'controller = mozmill.getPreferencesController()'
  } else if (windowtype == 'Extension:Manager') {
    var w = wm.getMostRecentWindow('Extension:Manager');
    controllerString = 'controller = mozmill.getAddonsController()'
  }
  
  if (!w) {
    if (windowtype == null) {
      var windowtype = '';
    }
    w = wm.getMostRecentWindow(windowtype);
    controllerString = 'controller = new mozmill.controller.MozMillController(mozmill.utils.getWindowByTitle("'+w.title+'"))';
  }
  
  if (w.document == _document) {
    return {'controllerString':controllerString, 'documentString':'controller.window.document'}
  } else if ((w.frames) && Array(w.frames).length > 0) {
    for (i in Array(w.frames)) {
      if (w.frames[i].document == _document) {
        return {'controllerString':controllerString,
                'documentString':'controller.window.frames['+i+'].document',}
      }
    }
  } 
  if (controllerString == 'controller = mozmill.getBrowserController()') {
    var documentString = 'controller.tabs.activeTab';
  } else { var documentString = 'Cannot find document'; }
  return {'controllerString':controllerString, 'documentString':documentString,}
}


var MozMilldx = new function() {
  this.lastEvent = null;
  
  this.grab = function(){
    var disp = $('dxDisplay').textContent;
    var dispArr = disp.split(': ');
    $('editorInput').value += 'new elementslib.'+dispArr[0].toUpperCase()+"('"+dispArr[1]+"')\n";
  }
  
  this.evtDispatch = function(e){    
    if (e.originalTarget != undefined) {
      target = e.originalTarget;
    } else {
      target = e.target;
    }
    
    //Element hilighting
    if (e.type == "mouseover"){
      try {
        if (this.lastEvent){
          this.lastEvent.target.style.border = "";
        }
        this.lastEvent = e;
        e.target.style.border = "1px solid darkblue";
      } catch(err){}
    }
    else { e.target.style.border = ""; }
    
    var _document = getDocument(target);
    
    if (isMagicAnonymousDiv(_document, target)) {
      target = target.parentNode;
    }
    
    var windowtype = _document.documentElement.getAttribute('windowtype');
    r = getControllerAndDocument(_document, windowtype);
    
    displayText = "Controller: " + r.controllerString + '\n\n';
    if ( isNotAnonymous(target) ) {  
      // Logic for which identifier to use is duplicated above
      if (target.id != "") {
        elemText = "Element: new elementslib.ID("+ r.documentString + ', "' + target.id + '");' + '\n';
        var telem = new elementslib.ID(_document, target.id);
      } else if ((target.name != "") && (typeof(target.name) != "undefined")) {
        elemText = "Element: new elementslib.Name("+ r.documentString + ', "' + target.name + '");' + '\n';
        var telem = new elementslib.Name(_document, target.name);
      } else if (target.nodeName == "A") {
        var linkText = removeHTMLTags(target.innerHTML);
        elemText = "Element: new elementslib.Link("+ r.documentString + ', "' + linkText + '");' + '\n';
        var telem = new elementslib.Link(_document, linkText);
      } 
    }
    // Fallback on XPath
    if (telem == undefined || telem.getNode() != target) {
      if (windowtype == null) {
        var stringXpath = getXSPath(target);
      } else {
        var stringXpath = getXULXpath(target, _document);
      }      
      var telem = new elementslib.XPath(_document, stringXpath);
      if ( telem.getNode() == target ) {
        elemText = "Element: new elementslib.XPath("+ r.documentString + ', "' + stringXpath + '");' + '\n';
      }
    }
    // Fallback to Lookup
    if (telem == undefined || telem.getNode() != target) {
      var exp = getLookupExpression(_document, target);
      elemText = "Element: new elementslib.Lookup("+ r.documentString + ", '" + exp + "')" + '\n';
      var telem = new elementslib.Lookup(_document, exp);
    } 
    
    displayText += elemText;
    
    try {
      displayText += "\nValidation: " + ( target == telem.getNode() );
      $('dxDisplay').value = displayText;
    } catch (err) {
      displayText += "\nValidation: false";
      $('dxDisplay').value = displayText;
      throw err;
    }
    
  }
  
    this.dxToggle = function(){
      if ($('domExplorer').getAttribute('label') ==  'Disable Inspector'){
        turnDXOff();
      }
      else{
        turnDXOn();
      }
    }
  
    //Turn on the recorder
    //Since the click event does things like firing twice when a double click goes also
    //and can be obnoxious im enabling it to be turned off and on with a toggle check box
    this.dxOn = function() {
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

    this.dxOff = function() {
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
         var enumerator = Components.classes["@mozilla.org/appshell/window-mediator;1"]
                             .getService(Components.interfaces.nsIWindowMediator)
                             .getEnumerator("");
          while(enumerator.hasMoreElements()) {
            var win = enumerator.getNext();
            //if (win.title != 'Error Console' && win.title != 'MozMill IDE'){
            if (win.title != 'MozMill IDE'){
              this.dxRecursiveUnBind(win, clickMethod);
            }
          }
    }
    
    this.getFoc = function(e){
      turnDXOff();
      e.target.style.border = "";
      e.stopPropagation();
      e.preventDefault();
      window.focus();
    }
    
    //Copy inspector output to clipboard if alt,shift,c is pressed
    this.clipCopy = function(e){
       if (e.altKey && e.shiftKey && (e.charCode == 199)){
           copyToClipboard($('dxDisplay').value);
       }
       else if (e.charCode != 0){
         $('eventsOut').value += "Shift Key: "+ e.shiftKey + "\n";
         $('eventsOut').value += "Control Key: "+ e.ctrlKey + "\n";
         $('eventsOut').value += "Alt Key: "+ e.altKey + "\n";
         $('eventsOut').value += "Meta Key: "+ e.metaKey + "\n\n";
         
         var ctrlString = "";
         ctrlString += "Controller:\ncontroller.keypress(element,"+e.charCode+",";
         ctrlString += e.ctrlKey.toString()+",";
         ctrlString += e.altKey.toString()+",";
         ctrlString += e.shiftKey.toString()+",";
         ctrlString += e.metaKey.toString()+");\n\n";
         
         ctrlString = ctrlString.replace(/undefined/g, "false");         
         $('eventsOut').value += ctrlString;
       }
    }
    
    //Recursively bind to all the iframes and frames within
    this.dxRecursiveBind = function(frame, clickMethod) {
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
    this.dxRecursiveUnBind = function(frame, clickMethod) {

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
};