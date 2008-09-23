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

var getDocument = function (elem) {
  while (elem.parentNode) {
    var elem = elem.parentNode;
  }
  return elem;
}

var getLookupExpression = function (_document, elem) {
  if ( arrays.inArray(elem.parentNode.childNodes, elem) ) {
    // Logic copied from below, inside the inspector.
    
  } else {
    // Handle Anonymous Nodes
    var parse = elem.parentNode.childNodes;
    parse.unshift(dom.getAttributes(elem));
    var getUniqueAttributes = function (attributes, node) {
      var nattributes = {};
      for (i in attributes) {
        if ( node.getAttribute(i) != attributes(i) ) {
          nattributes[i] = attributes(i);
        } 
      }
      return nattributes;
    }
    var uniqueAttributes = parse.reduce(getUniqueAttributes);
    if (objects.getLength(uniqueAttributes) == 0) {
      return 'anon(['+arrays.indexOf(elem.parentNode.childNodes, elem)+'])';
    } else if (arrays.inArray(uniqueAttributes, 'anonid')) {
      return 'anon({"anonid":"'+uniqueAttributes['anonid']+'"})';
    } else {
      return 'anon('+json2.JSON.stringify(uniqueAttributes)+')';
    }    

  }
}

var MozMilldx = new function() {
  this.grab = function(){
    var disp = $('dxDisplay').textContent;
    var dispArr = disp.split(': ');
    $('editorInput').value += 'new elementslib.'+dispArr[0].toUpperCase()+"('"+dispArr[1]+"')\n";
  }
  
  this.evtDispatch = function(e){
    /// 
    if (e.originalTarget != undefined) {
      target = e.originalTarget;
    } else {
      target = e.target;
    }
   
    if ( isNotAnonymous(target) ) {
      var _document = getDocument(target);
      var windowtype = _document.documentElement.getAttribute('windowtype');
      displayText = "windowtype: " + windowtype + '\n';
      // Logic for which identifier to use is duplicated above
      if (target.id != "") {
        displayText += "ID: " + target.id + '\n';
        var telem = new elementslib.ID(_document, target.id);
      } else if ((target.name != "") && (typeof(target.name) != "undefined")) {
        displayText += "Name: " + target.name + '\n';
        var telem = new elementslib.Name(_document, target.name);
      } else if (target.nodeName == "A") {
        displayText += "Link: " + target.innerHTML + '\n';
        var telem = new elementslib.Link(_document, target.innerHTML);
      } else {
        if (windowtype == null) {
          var stringXpath = getXSPath(target);
        } else {
          var stringXpath = getXULXpath(target);
        }
        displayText += 'XPath: ' + stringXpath + '\n';
        var telem = new elementslib.XPath(_document, stringXpath);
      }
      displayText += "Validation: " + ( target == telem.getNode() );
      $('dxDisplay').value = displayText;
    } else {
      $('dxDisplay').value = 'Lookup'
    } 
  }
  
  this.getFoc = function(){
    window.focus();
  }
  
    //Turn on the recorder
    //Since the click event does things like firing twice when a double click goes also
    //and can be obnoxious im enabling it to be turned off and on with a toggle check box
    this.dxOn = function() {
      $('stopDX').setAttribute("disabled","false");
      $('startDX').setAttribute("disabled","true");
      $('dxContainer').style.display = "block";
      //var w = Components.classes['@mozilla.org/appshell/window-mediator;1'].getService(Components.interfaces.nsIWindowMediator).getMostRecentWindow('');
      var enumerator = Components.classes["@mozilla.org/appshell/window-mediator;1"]
                         .getService(Components.interfaces.nsIWindowMediator)
                         .getEnumerator("");
      while(enumerator.hasMoreElements()) {
        var win = enumerator.getNext();
        //if (win.title != 'Error Console' && win.title != 'MozMill IDE'){
        if (win.title != 'MozMill IDE'){
          this.dxRecursiveBind(win);
          win.focus();
        }
      }
    }

    this.dxOff = function() {
        //because they share this box
        var copyOutputBox = $('copyout');
        copyOutputBox.removeAttribute("checked");
        
        $('stopDX').setAttribute("disabled","true");
        $('startDX').setAttribute("disabled","false");
        $('dxContainer').style.display = "none";
        //var w = Components.classes['@mozilla.org/appshell/window-mediator;1'].getService(Components.interfaces.nsIWindowMediator).getMostRecentWindow('');
         var enumerator = Components.classes["@mozilla.org/appshell/window-mediator;1"]
                             .getService(Components.interfaces.nsIWindowMediator)
                             .getEnumerator("");
          while(enumerator.hasMoreElements()) {
            var win = enumerator.getNext();
            //if (win.title != 'Error Console' && win.title != 'MozMill IDE'){
            if (win.title != 'MozMill IDE'){  
              this.dxRecursiveUnBind(win);
            }
          }
    }

    //Recursively bind to all the iframes and frames within
    this.dxRecursiveBind = function(frame) {
        //Make sure we haven't already bound anything to this frame yet
        this.dxRecursiveUnBind(frame);

        frame.addEventListener('mouseover', this.evtDispatch, true);
        frame.addEventListener('mouseout', this.evtDispatch, true);
        frame.addEventListener('dblclick', this.getFoc, true);
        
        var iframeCount = frame.window.frames.length;
        var iframeArray = frame.window.frames;

        for (var i = 0; i < iframeCount; i++)
        {
            try {
              iframeArray[i].addEventListener('mouseover', this.evtDispatch, true);
              iframeArray[i].addEventListener('mouseout', this.evtDispatch, true);
              iframeArray[i].addEventListener('dblclick', this.getFoc, true);

              this.dxRecursiveBind(iframeArray[i]);
            }
            catch(error) {
                //mozmill.results.writeResult('There was a problem binding to one of your iframes, is it cross domain?' + 
                //'Binding to all others.' + error);

            }
        }
    }

    //Recursively bind to all the iframes and frames within
    this.dxRecursiveUnBind = function(frame) {

        frame.removeEventListener('mouseover', this.evtDispatch, true);
        frame.removeEventListener('mouseout', this.evtDispatch, true);
        frame.removeEventListener('dblclick', this.getFoc, true);
        
        var iframeCount = frame.window.frames.length;
        var iframeArray = frame.window.frames;

        for (var i = 0; i < iframeCount; i++)
        {
            try {
              iframeArray[i].removeEventListener('mouseover', this.evtDispatch, true);
              iframeArray[i].removeEventListener('mouseout', this.evtDispatch, true);
              iframeArray[i].removeEventListener('dblclick', this.getFoc, true);
    
              this.dxRecursiveUnBind(iframeArray[i]);
            }
            catch(error) {
                //mozmill.results.writeResult('There was a problem binding to one of your iframes, is it cross domain?' + 
                //'Binding to all others.' + error);
            }
        }
    }

};