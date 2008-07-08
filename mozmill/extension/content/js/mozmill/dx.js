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
mozmill.ui.dx = new function() {
  this.grab = function(){
    var disp = $('dxDisplay').textContent;
    var dispArr = disp.split(': ');
    $('editorInput').value += 'elementslib.'+dispArr[0].toUpperCase()+"('"+dispArr[1]+"')\n";
  }
  
  this.evtDispatch = function(e){
     if (e.target.id != "") {
        $('dxDisplay').textContent= "ID: " + e.target.id;
      }
      else if ((e.target.name != "") && (typeof(e.target.name) != "undefined")) {
        $('dxDisplay').textContent = "Name: " + e.target.name;
      }
      else if (e.target.nodeName == "A") {
        $('dxDisplay').textContent = "Link: " + e.target.innerHTML;
      }
      //if not just use the xpath
      else {
        var stringXpath = getXSPath(e.target);
        //$("domExp").innerHTML = 'XPath: ' + stringXpath;
        $('dxDisplay').textContent = 'XPath: ' + stringXpath;
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
      mozmill.testWindow.focus();
      this.dxRecursiveBind(mozmill.testWindow);
    }

    this.dxOff = function() {
        $('stopDX').setAttribute("disabled","true");
        $('startDX').setAttribute("disabled","false");
        $('dxContainer').style.display = "none";
        this.dxRecursiveUnBind(mozmill.testWindow);
    }

    //Recursively bind to all the iframes and frames within
    this.dxRecursiveBind = function(frame) {
        //Make sure we haven't already bound anything to this frame yet
        this.dxRecursiveUnBind(frame);

        fleegix.event.listen(frame, 'onmouseover', this, 'evtDispatch');
        fleegix.event.listen(frame, 'onmouseout', this, 'evtDispatch');
        fleegix.event.listen(frame, 'onclick', this, 'getFoc');

        var iframeCount = frame.window.frames.length;
        var iframeArray = frame.window.frames;

        for (var i = 0; i < iframeCount; i++)
        {
            try {
              fleegix.event.listen(frame.document, 'onmouseover', this, 'evtDispatch');
              fleegix.event.listen(frame.document, 'onmouseout', this, 'evtDispatch');
              fleegix.event.listen(iframeArray[i], 'onclick', this, 'getFoc');

                this.dxRecursiveBind(iframeArray[i]);

            }
            catch(error) {
                mozmill.results.writeResult('There was a problem binding to one of your iframes, is it cross domain?' + 
                'Binding to all others.' + error);

            }

        }

    }

    //Recursively bind to all the iframes and frames within
    this.dxRecursiveUnBind = function(frame) {

        fleegix.event.unlisten(frame, 'onmouseover', this, 'evtDispatch');
        fleegix.event.unlisten(frame, 'onmouseout', this, 'evtDispatch');
        fleegix.event.unlisten(frame, 'onclick', this, 'getFoc');
        
        var iframeCount = frame.window.frames.length;
        var iframeArray = frame.window.frames;

        for (var i = 0; i < iframeCount; i++)
        {
            try {
                fleegix.event.unlisten(iframeArray[i], 'onmouseover', this, 'evtDispatch');
                fleegix.event.unlisten(iframeArray[i], 'onmouseout', this, 'evtDispatch');
                fleegix.event.unlisten(iframeArray[i], 'onclick', this, 'getFoc');
    
                this.dxRecursiveUnBind(iframeArray[i]);
            }
            catch(error) {
                mozmill.results.writeResult('There was a problem binding to one of your iframes, is it cross domain?' + 
                'Binding to all others.' + error);
            }
        }
    }

};