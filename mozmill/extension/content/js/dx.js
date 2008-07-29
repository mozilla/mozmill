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
var MozMilldx = new function() {
  this.grab = function(){
    var disp = $('dxDisplay').textContent;
    var dispArr = disp.split(': ');
    $('editorInput').value += 'new elementslib.'+dispArr[0].toUpperCase()+"('"+dispArr[1]+"')\n";
  }
  
  this.evtDispatch = function(e){
     if (e.originalTarget != undefined) {
       target = e.originalTarget;
     }
     else {
       target = e.target;
     }
    
     if (target.id != "") {
        $('dxDisplay').value= "ID: " + target.id;
      }
      else if ((target.name != "") && (typeof(target.name) != "undefined")) {
        $('dxDisplay').value = "Name: " + target.name;
      }
      else if (target.nodeName == "A") {
        $('dxDisplay').value = "Link: " + target.innerHTML;
      }
      //if not just use the xpath
      else {
        var stringXpath = getXSPath(target);
        //$("domExp").innerHTML = 'XPath: ' + stringXpath;
        $('dxDisplay').value = 'XPath: ' + stringXpath;
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
        if (win.title != 'Error Console' && win.title != 'MozMill IDE'){
          this.dxRecursiveBind(win);
          win.focus();
        }
      }
    }

    this.dxOff = function() {
        //because they share this box
        var copyOutputBox = $('copyout');
        copyOutputBox.label = 'Show Copyable Output';
        
        $('stopDX').setAttribute("disabled","true");
        $('startDX').setAttribute("disabled","false");
        $('dxContainer').style.display = "none";
        //var w = Components.classes['@mozilla.org/appshell/window-mediator;1'].getService(Components.interfaces.nsIWindowMediator).getMostRecentWindow('');
         var enumerator = Components.classes["@mozilla.org/appshell/window-mediator;1"]
                             .getService(Components.interfaces.nsIWindowMediator)
                             .getEnumerator("");
          while(enumerator.hasMoreElements()) {
            var win = enumerator.getNext();
            if (win.title != 'Error Console' && win.title != 'MozMill IDE'){
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