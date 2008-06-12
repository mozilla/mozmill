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

//Functionality that works for every browser
//Mozilla specific functionality abstracted to mozcontroller.js
//Safari specific functionality abstracted to safcontroller.js
//IE specific functionality abstracted to iecontroller.js
//The reason for this is that the start page only includes the one corresponding
//to the current browser, this means that the functionality in the controller
//object is only for the current browser, and there is only one copy of the code being
//loaded into the browser for performance.
mozmill.xhr = new
function() {

    //Keep track of the loop state, running or paused
    this.loopState = false;
    this.timeoutId = null;

    //action callback
    this.actionHandler = function(str) {
        //If the are variables passed we need to do our lex and replace
        if ((str.indexOf('{$') != -1) && (mozmill.runTests == true)) {
            str = mozmill.controller.handleVariable(str);
        }

        mozmill.xhr.xhrResponse = eval('(' + str + ')');

        //If there was a legit json response
        if (mozmill.xhr.xhrResponse.error) {
            mozmill.ui.results.writeResult("There was a JSON syntax error: '" + 
            mozmill.xhr.xhrResponse.error + "'");
        }
        else {
            if (mozmill.xhr.xhrResponse.result.method != 'defer') {
                mozmill.ui.results.writeStatus("Running " + mozmill.xhr.xhrResponse.result.method + "...");
                mozmill.ui.playback.setPlaying();
            }
            else {
                mozmill.ui.playback.resetPlayBack();
                mozmill.ui.results.writeStatus("Ready, Waiting for tests...");
            }

            //Init and start performance but not if the protocol defer
            if (mozmill.xhr.xhrResponse.result.method != 'defer') {

                //Put on mozmill main page that we are running something
                mozmill.xhr.action_timer = new TimeObj();
                mozmill.xhr.action_timer.setName(mozmill.xhr.xhrResponse.result.method);
                mozmill.xhr.action_timer.startTime();

                //If the action already exists in the UI, skip all the creating suite stuff
                if (mozmill.remote.$(mozmill.xhr.xhrResponse.result.params.uuid) != null) {
                    var action = mozmill.remote.$(mozmill.xhr.xhrResponse.result.params.uuid);
                    action.style.background = 'lightyellow';
                }
                //If its a command we don't want to build any UI
                else if (mozmill.xhr.xhrResponse.result.method.split(".")[0] == 'commands') {
                    //do nothing
                    }
                else {
                    var action = mozmill.xhr.createActionFromSuite(mozmill.xhr.xhrResponse.result.suite_name, mozmill.xhr.xhrResponse.result);
                }

                //Forgotten case; If the mozmill.runTests is false, but we are trying to change it back to true with a command
                //This fix runs all commands regardless  
                //Run the action
                //If it's a user extension.. run it
                if ((mozmill.runTests == true) || (mozmill.xhr.xhrResponse.result.method.split(".")[0] == 'commands')) {
                    try {
                        //Wait/open needs to not grab the next action immediately
                        if ((mozmill.xhr.xhrResponse.result.method.split(".")[0] == 'waits')) {
                            mozmill.controller.stopLoop();
                            mozmill.xhr.xhrResponse.result.params.aid = action.id;
                        }
                        if (mozmill.xhr.xhrResponse.result.method.indexOf('.') != -1) {
                            //if asserts.assertNotSomething we need to set the result to !result
                            if (mozmill.xhr.xhrResponse.result.method.indexOf('asserts.assertNot') != -1) {
                                var mArray = mozmill.xhr.xhrResponse.result.method.split(".");
                                var m = mArray[1].replace('Not', '');
                                var result = !mozmill.controller[mArray[0]][m](mozmill.xhr.xhrResponse.result.params);
                            }
                            //Normal asserts and waits
                            else {
                                var mArray = mozmill.xhr.xhrResponse.result.method.split(".");
                                var result = mozmill.controller[mArray[0]][mArray[1]](mozmill.xhr.xhrResponse.result.params, mozmill.xhr.xhrResponse.result);
                            }
                        }
                        //Every other action that isn't namespaced
                        else {
                            var result = mozmill.controller[mozmill.xhr.xhrResponse.result.method](mozmill.xhr.xhrResponse.result.params);
                        }
                    }
                    catch(error) {
                        mozmill.ui.results.writeResult("<font color=\"#FF0000\">There was an error in the " + 
                        mozmill.xhr.xhrResponse.result.method + " action. " + error + "</font>");
                        mozmill.ui.results.writeResult("<br>Action: <b>" + mozmill.xhr.xhrResponse.result.method + 
                        "</b><br>Parameters: " + fleegix.json.serialize(mozmill.xhr.xhrResponse.result.params) + 
                        "<br>Test Result: <font color=\"#FF0000\"><b>" + result + '</b></font>');

                        result = false;
                        //If the option to throw errors is set
                        if ($('throwDebug').checked == true) {
                            if (console.log) {
                                console.log(error);
                            }
                            else {
                                throw (error);
                            }
                        }
                        else {
                            if (!$('toggleBreak').checked) {
                                mozmill.controller.continueLoop();
                            }
                        }
                    }
                }
                else {
                    //we must be loading, change the status to reflect that
                    mozmill.ui.results.writeStatus("Loading " + mozmill.xhr.xhrResponse.result.method + "...");
                    result == true;
                }
                var m = mozmill.xhr.xhrResponse.result.method.split(".");
                //Send the report if it's not in the commands namespace, we only call report for test actions
                if ((m[0] != 'commands') && (m[0] != 'waits') && (mozmill.runTests == true)) {
                    //End timer and store
                    mozmill.xhr.action_timer.endTime();
                    mozmill.xhr.sendReport(mozmill.xhr.xhrResponse.result.method, result, mozmill.xhr.action_timer);
                    mozmill.xhr.setActionBackground(action, result, mozmill.xhr.xhrResponse.result);
                    //Do the timer write
                    mozmill.xhr.action_timer.write(fleegix.json.serialize(mozmill.xhr.xhrResponse.result.params));
                }
            }
        }
        //Get the next action from the service
        setTimeout("mozmill.xhr.getNext()", mozmill.serviceDelay);

    };

    //Send the report
    this.sendReport = function(method, result, timer) {
        var reportHandler = function(str) {
            response = eval('(' + str + ')');
            if (!response.result == 200) {
                mozmill.ui.results.writeResult('Error: Report receiving non 200 response.');
            }
        };
        var result_string = fleegix.json.serialize(mozmill.xhr.xhrResponse.result);
        var test_obj = {
            "result": result,
            "uuid": mozmill.xhr.xhrResponse.result.params.uuid,
            "starttime": timer.getStart(),
            "endtime": timer.getEnd()
        };
        var json_object = new json_call('1.1', 'report');
        json_object.params = test_obj;
        var json_string = fleegix.json.serialize(json_object);
        //Actually send the report
        fleegix.xhr.doPost(reportHandler, '/mozmill-jsonrpc/', json_string);
    };


    //Get the next action from the server
    this.getNext = function() {
        mozmill.ui.results.writeStatus('Looping...');
        
        //write to the output tab what is going on
        var handleTimeout = function() {
            mozmill.ui.results.writeResult('One of the XHR requests to the server timed out.');
        }

        if (mozmill.xhr.loopState) {
            var jsonObject = new json_call('1.1', 'next_action');
            var jsonString = fleegix.json.serialize(jsonObject);

            //Execute the post to get the next action
            //Set the xhr timeout to be really high
            //handle the timeout manually
            //Prevent caching
            fleegix.xhr.doReq({
                method: 'POST',
                handleSuccess: this.actionHandler,
                responseFormat: 'text',
                url: '/mozmill-jsonrpc/',
                timeoutSeconds: mozmill.xhrTimeout,
                handleTimeout: handleTimeout,
                preventCache: true,
                dataPayload: jsonString

            });

        }

    };

    this.clearQueue = function() {
        var h = function(str) {
            mozmill.ui.results.writeResult('Cleared backend queue, ' + str);
        }
        var test_obj = {};
        var json_object = new json_call('1.1', 'clear_queue');
        var json_string = fleegix.json.serialize(json_object);
        //Actually send the report
        fleegix.xhr.doPost(h, '/mozmill-jsonrpc/', json_string);

    };

    this.createActionFromSuite = function(suiteName, actionObj) {
        //If the suite name is null, set it to default
        if (suiteName == null) {
            suiteName = 'Default';
        }
        var suite = mozmill.ui.remote.getSuite(suiteName);

        //Add the action to the suite
        var action = mozmill.ui.remote.buildAction(actionObj.method, actionObj.params);
        //var suite = mozmill.remote.$(result);
        suite.appendChild(action);
        //IE Hack
        if (mozmill.browser.isIE) {
            mozmill.remote.$(action.id).innerHTML = action.innerHTML;
        }
        var ide = mozmill.remote.$('ide');

        //If the settings box is checked, scroll to the bottom
        if (mozmill.remote.$('autoScroll').checked == true) {
            ide.scrollTop = ide.scrollHeight;
        }
        return action;
    };

    this.setActionBackground = function(action, result, obj) {
 
        if (result != true) {
            if (typeof(action) != 'undefined') {
                action.style.background = '#FF9692';
            }
            mozmill.ui.results.writeResult("<br>Action: <b>" + obj.method + 
            "</b><br>Parameters: " + fleegix.json.serialize(obj.params) + "<br>Test Result: <font color=\"#FF0000\"><b>" + result + '</b></font>');
            //if the continue on error flag has been set by the shell.. then we just keep on going
            if (mozmill.stopOnFailure == true) {
                mozmill.xhr.loopState = false;
                mozmill.ui.results.writeStatus("Paused, error?...");
            }
        }
        else {
            //Write to the result tab
            mozmill.ui.results.writeResult("<br>Action: <b>" + obj.method + 
            "</b><br>Parameters: " + fleegix.json.serialize(obj.params) + "<br>Test Result: <font color=\"#61d91f\"><b>" + result + '</b></font>');
            if ((typeof(action) != 'undefined') && (mozmill.runTests == true)) {
                action.style.background = '#C7FFCC';
            }
        }
    };
    this.setWaitBgAndReport = function(aid, result, obj) {
        if (!obj) {
            return false;
        }
        
        var action = $(aid);
        mozmill.xhr.action_timer.endTime();

        if (result != true) {
            if (typeof(action) != 'undefined') {
                action.style.background = '#FF9692';
            }
            mozmill.ui.results.writeResult("<br>Action: <b>" + obj.method + 
            "</b><br>Parameters: " + fleegix.json.serialize(obj.params) + "<br>Test Result: <font color=\"#FF0000\"><b>" + result + '</b></font>');
            //if the continue on error flag has been set by the shell.. then we just keep on going
            if (mozmill.stopOnFailure == true) {
                mozmill.xhr.loopState = false;
                mozmill.ui.results.writeStatus("Paused, error?...");
            }
        }
        else {
            //Write to the result tab
            mozmill.ui.results.writeResult("<br>Action: <b>" + obj.method + 
            "</b><br>Parameters: " + fleegix.json.serialize(obj.params) + "<br>Test Result: <font color=\"#61d91f\"><b>" + result + '</b></font>');
            try {
                if ((typeof(action) != 'undefined') && (mozmill.runTests == true)) {
                    action.style.background = '#C7FFCC';
                }
            }
            catch(err) {}
        }
        //Send the report
        mozmill.xhr.xhrResponse.result = obj;
        //Don't report if we are running js tests
        if (obj.params.orig != 'js'){
          mozmill.xhr.sendReport(obj.method, result, mozmill.xhr.action_timer);
        }
        mozmill.xhr.action_timer.write(fleegix.json.serialize(obj.params));
    };


};
