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

//DOM Explorer Functions
mozmill.ui.domexplorer = new
function() {
    var exploreState = false;
    //this.domExplorerBorder = '';
    this.setExploreState = function() {
        if (this.exploreState == true) {
            this.domExplorerOn();
        }
    }

    //Reset the border to what it was before the mouse over
    this.resetBorder = function(e) {
        e.target.style.border = '';
        //e.target.style.border = this.domExplorerBorder;
    }

    //Display the id in the remote
    this.setIdInRemote = function(e) {
        //console.log  (typeof(e.target.name));
     /*   if (mozmill.ui.remote.selectedElement != null) {
            mozmill.remote.$("domExp").style.display = 'none';

        }*/
        //if absolute xpath is not wanted try our best to get a better locater
     //   if (mozmill.remote.$('useXpath').checked == false) {
            var ct = "";
            if (e.target.id != "") {
                ct = "ID: " + e.target.id;

            }
            else if ((e.target.name != "") && (typeof(e.target.name) != "undefined")) {
                ct = "Name: " + e.target.name;

            }
            else if (e.target.nodeName == "A") {
               ct = "Link: " + e.target.innerHTML;

            }
            //if not just use the xpath
          else {
                var stringXpath = getXSPath(e.target);
                //mozmill.dxw.$('dxwindow').textContent = 'XPath: ' + stringXpath;
                ct = 'XPath: ' + stringXpath;
            }

     /*   }
        else {
            var stringXpath = getXSPath(e.target);
            mozmill.remote.$("domExp").innerHTML = 'XPath: ' + stringXpath;

        }*/
        alert('here');
        mozmill.ui.results.writeResult(ct);
        //this.domExplorerBorder = e.target.style.border;
        e.target.style.border = "1px solid yellow";
//        this.explorerUpdate(e);

    }

    this.explorerUpdate = function(e) {
        e.cancelBubble = true;
            e.stopPropagation();
            e.preventDefault();

        //if an element in the remote has been selected
        if (mozmill.ui.remote.selectedElement != null) {
            var id = mozmill.ui.remote.selectedElement.replace('locator', '');
            //Incase if that node has been removed somehow
            try {
                var a = mozmill.remote.$("domExp").innerHTML.split(': ');
                //If the element is a link, get rid of the all the garbage
                if (a[0] == 'link') {
                    a[1] = a[1].replace(/(<([^>]+)>)/ig, "");
                    a[1] = a[1].replace(/\n/g, "");

                }
                mozmill.remote.$(id + 'locatorType').value = a[0].toLowerCase();
                mozmill.remote.$(id + 'locator').value = a[1];
                mozmill.remote.$(id + 'locator').focus();

            }
            catch(error) {
                mozmill.ui.results.writeResult('Error in dom explorer');

            }

        }

    }

    this.explorerClick = function(e) {
        mozmill.remote.window.focus();


    }

    //Set the listeners for the dom explorer
    this.domExplorerOn = function() {

      //var dxw = window.open("chrome://mozmill/content/dxwindow.xul", "", "chrome,modal,alwaysRaised,height=150,width=250");
      //mozmill.dxw = dxw;
      //mozmill.testWindow.focus();
      
      this.dxRecursiveBind(mozmill.testWindow);
    }

    //Remove the listeners for the dom explorer
    this.domExplorerOff = function() {
        this.exploreState = false;

        try {
            //Reset the selected element
            mozmill.ui.remote.selectedElement = null;
            this.dxRecursiveUnBind(mozmill.testWindow);

        }
        catch(error) {
            mozmill.ui.results.writeResult('You must not have set your URL correctly when launching Windmill, we are getting cross domain exceptions.');
            this.exploreState = false;

        }

    }

    this.clk = function(){
      alert('foo');
    }
     //Recursively bind to all the iframes and frames within
      this.dxRecursiveBind = function(frame) {
          //Make sure we haven't already bound anything to this frame yet
          //this.recRecursiveUnBind(frame);
      //    fleegix.event.listen(frame, 'onunload', mozmill, 'unloaded');
        //  fleegix.event.listen(frame, 'ondblclick', this, 'writeJsonClicks');
          //fleegix.event.listen(frame, 'onchange', this, 'writeJsonChange');
          fleegix.event.listen(frame, 'onclick', this, 'clk');

          var iframeCount = frame.window.frames.length;
          var iframeArray = frame.window.frames;

          for (var i = 0; i < iframeCount; i++)
          {
              try {
               //   fleegix.event.listen(iframeArray[i], 'onunload', mozmill, 'unloaded');
                 // fleegix.event.listen(iframeArray[i], 'ondblclick', this, 'writeJsonClicks');
                //  fleegix.event.listen(iframeArray[i], 'onchange', this, 'writeJsonChange');
                  fleegix.event.listen(iframeArray[i], 'onclick', this, 'clk');

                  this.rdxRecursiveBind(iframeArray[i]);

              }
              catch(error) {
                  mozmill.ui.results.writeResult('There was a problem binding to one of your iframes, is it cross domain?' + 
                  'Binding to all others.' + error);

              }

          }

      }

      //Recursively bind to all the iframes and frames within
      this.dxRecursiveUnBind = function(frame) {

          fleegix.event.unlisten(frame, 'onunload', mozmill, 'unloaded');
          fleegix.event.unlisten(frame, 'ondblclick', this, 'writeJsonClicks');
          fleegix.event.unlisten(frame, 'onchange', this, 'writeJsonChange');
          fleegix.event.unlisten(frame, 'onclick', this, 'writeJsonClicks');

          var iframeCount = frame.window.frames.length;
          var iframeArray = frame.window.frames;

          for (var i = 0; i < iframeCount; i++)
          {
              try {
                  fleegix.event.unlisten(iframeArray[i], 'onunload', mozmill, 'unloaded');
                  fleegix.event.unlisten(iframeArray[i], 'ondblclick', this, 'writeJsonClicks');
                  fleegix.event.unlisten(iframeArray[i], 'onchange', this, 'writeJsonChange');
                  fleegix.event.unlisten(iframeArray[i], 'onclick', this, 'writeJsonClicks');

                  this.dxRecursiveUnBind(iframeArray[i]);

              }
              catch(error) {
                  mozmill.ui.results.writeResult('There was a problem binding to one of your iframes, is it cross domain?' + 
                  'Binding to all others.' + error);

              }

          }

      }

};