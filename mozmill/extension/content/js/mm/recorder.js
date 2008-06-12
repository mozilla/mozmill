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
mozmill.ui.recorder = new
function() {
    var recordState = false;

    this.setRecState = function() {
        if (this.recordState == true) {
            this.recordOn();

        }

    }
    //write json to the remote from the click events
    this.writeJsonClicks = function(e) {
     /*   if (this.recordState == false) {
            return;
        }*/
        var locator = '';
        var locValue = '';

//        if (mozmill.remote.$('useXpath').checked == false) {
            if (e.target.id != "") {
                locator = 'id';
                locValue = e.target.id;

            }
            else if ((typeof(e.target.name) != "undefined") && (e.target.name != "")) {
                locator = 'name';
                locValue = e.target.name;

            }
            else if (e.target.tagName.toUpperCase() == "A") {
                locator = 'link';
                locValue = e.target.innerHTML.replace(/(<([^>]+)>)/ig, "");
                locValue = locValue.replace(/^s*(.*?)s*$/, "$1");

            }
            else {
                var stringXpath = getXSPath(e.target);
                locator = 'xpath';
                locValue = stringXpath;

            }

 /*       }
        else {
            var stringXpath = getXSPath(e.target);
            locator = 'xpath';
            locValue = stringXpath;

        }*/
/*
        if (locValue != "") {
            var params = {};
            params[locator] = locValue;

            if (e.type == 'dblclick') {
                mozmill.ui.remote.addAction(mozmill.ui.remote.buildAction('doubleClick', params));

            }
            else {
                if (mozmill.remote.$("clickOn").checked == true) {
                    mozmill.ui.remote.addAction(mozmill.ui.remote.buildAction('click', params));

                }
                else if ((e.target.onclick != null) || (locator == 'link') || (e.target.tagName.toUpperCase() == 'IMG')) {
                    mozmill.ui.remote.addAction(mozmill.ui.remote.buildAction('click', params));

                }

            }

        }
        mozmill.ui.remote.scrollRecorderTextArea();
        */
        mozmill.ui.results.writeResult('clicked: '+locator+':'+locValue);
        
    }

    //Writing json to the remote for the change events
    this.writeJsonChange = function(e) {
      
    /*   if (this.recordState == false) {
            return;
        }*/
        var locator = '';
        var locValue = '';

     //   if (mozmill.remote.$('useXpath').checked == false) {
            if (e.target.id != "") {
                locator = 'id';
                locValue = e.target.id;

            }
            else if ((typeof(e.target.name) != "undefined") && (e.target.name != "")) {
                locator = 'name';
                locValue = e.target.name;
            }
            else {
                var stringXpath = getXSPath(e.target);
                locator = 'xpath';
                locValue = stringXpath;
            }
     /*   }
        else {
            var stringXpath = getXSPath(e.target);
            locator = 'xpath';
            locValue = stringXpath;

        }

        var params = {};
        params[locator] = locValue;

        if (e.target.type == 'textarea') {
            params['text'] = e.target.value;
            mozmill.ui.remote.addAction(mozmill.ui.remote.buildAction('type', params));


        }
        else if (e.target.type == 'text') {
            params['text'] = e.target.value;
            mozmill.ui.remote.addAction(mozmill.ui.remote.buildAction('type', params));

        }
        else if (e.target.type == 'password') {
            params['text'] = e.target.value;
            mozmill.ui.remote.addAction(mozmill.ui.remote.buildAction('type', params));

        }
        else if (e.target.type == 'select-one') {
            //we do playback based on the text, not the value
            //params['option'] = e.target.value;
            params['option'] = e.target.options[e.target.selectedIndex].text;
            mozmill.ui.remote.addAction(mozmill.ui.remote.buildAction('select', params));

        }
        else if (e.target.type == 'radio') {
            mozmill.ui.remote.addAction(mozmill.ui.remote.buildAction('radio', params));
        }
      */
        //The check function is only around now for reverse compatibilty, click does the
        //correct thing now in all browsers after the update to safari
        /* else if(e.target.type == "checkbox"){
      mozmill.ui.remote.addAction(mozmill.ui.remote.buildAction('check', params));    
    }
  */      
    mozmill.ui.results.writeResult('changed: '+locator+':'+locValue);
        //mozmill.ui.remote.scrollRecorderTextArea();
    }

    //Turn on the recorder
    //Since the click event does things like firing twice when a double click goes also
    //and can be obnoxious im enabling it to be turned off and on with a toggle check box
    this.recordOn = function() {
      $('stopRec').setAttribute("disabled","false");
      $('startRec').setAttribute("disabled","true");
      $('mmtabs').setAttribute("selectedIndex", 2);
      mozmill.testWindow.focus();
      
        //Turn off the listeners so that we don't have multiple attached listeners for the same event
      //  this.recordOff();
        //keep track of the recorder state, for page refreshes
        this.recordState = true;
        //mozmill.remote.$('record').src = 'img/stoprecord.png';

        //if when loading the listener didn't get attached
        //we attach it if they are recording because we need to know
        //when the new page is loading so we can re-attach
      //  fleegix.event.unlisten(mozmill.testWindow, 'onunload', mozmill, 'unloaded');
      //  fleegix.event.listen(mozmill.testWindow, 'onunload', mozmill, 'unloaded');

   //     mozmill.ui.remote.getSuite();
   //     try {
            this.recRecursiveBind(mozmill.testWindow);
     /*   }
        catch(error) {
            mozmill.ui.results.writeResult('You must not have set your URL correctly when launching Windmill, we are getting cross domain exceptions.');
            mozmill.remote.$('record').src = 'img/record.png';
            this.recordState = false;
        }*/
    }

    this.recordOff = function() {
        $('stopRec').setAttribute("disabled","true");
        $('startRec').setAttribute("disabled","false");
        $('mmtabs').setAttribute("selectedIndex", 0);
        
        this.recordState = false;
      //  mozmill.remote.$('record').src = 'img/record.png';

        try {
            this.recRecursiveUnBind(mozmill.testWindow);

        }
        catch(error) {
            mozmill.ui.results.writeResult('You must not have set your URL correctly when launching Windmill,' + 
            'we are getting cross domain exceptions.' + error);

        }

    }

    //Recursively bind to all the iframes and frames within
    this.recRecursiveBind = function(frame) {
        //Make sure we haven't already bound anything to this frame yet
        //this.recRecursiveUnBind(frame);
        fleegix.event.listen(frame, 'onunload', mozmill, 'unloaded');
        fleegix.event.listen(frame, 'ondblclick', this, 'writeJsonClicks');
        fleegix.event.listen(frame, 'onchange', this, 'writeJsonChange');
        fleegix.event.listen(frame, 'onclick', this, 'writeJsonClicks');

        var iframeCount = frame.window.frames.length;
        var iframeArray = frame.window.frames;

        for (var i = 0; i < iframeCount; i++)
        {
            try {
                fleegix.event.listen(iframeArray[i], 'onunload', mozmill, 'unloaded');
                fleegix.event.listen(iframeArray[i], 'ondblclick', this, 'writeJsonClicks');
                fleegix.event.listen(iframeArray[i], 'onchange', this, 'writeJsonChange');
                fleegix.event.listen(iframeArray[i], 'onclick', this, 'writeJsonClicks');

                this.recRecursiveBind(iframeArray[i]);

            }
            catch(error) {
                mozmill.ui.results.writeResult('There was a problem binding to one of your iframes, is it cross domain?' + 
                'Binding to all others.' + error);

            }

        }

    }

    //Recursively bind to all the iframes and frames within
    this.recRecursiveUnBind = function(frame) {

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

                this.recRecursiveUnBind(iframeArray[i]);

            }
            catch(error) {
                mozmill.ui.results.writeResult('There was a problem binding to one of your iframes, is it cross domain?' + 
                'Binding to all others.' + error);

            }

        }

    }

};