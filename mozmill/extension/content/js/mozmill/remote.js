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

//Functions for interacting with the remote
/***************************************/
mozmill.ui.remote = new
function() {
    this.selectedElement = null;

    this.scrollRecorderTextArea = function() {
        var obj = mozmill.remote.$("ide");
        obj.scrollTop = obj.scrollHeight;

    };

    this.clearIDE = function() {
        input_box = mozmill.remote.confirm("Are you sure you want to delete all the data in the IDE?");
        if (input_box == true) {
            fleegix.fx.fadeOut(mozmill.remote.$('ideForm'));
            d = function() {
                mozmill.remote.$('ideForm').innerHTML = '';
                mozmill.ui.recorder.recordOff();
                fleegix.fx.fadeIn(mozmill.remote.$('ideForm'));

            };
            setTimeout("d()", 800);

        }

    };

    this.methodChange = function(id) {
        var selected = mozmill.remote.$(id + 'method').selectedIndex;
        var methodObj = mozmill.remote.$(id + 'method');
        var method = methodObj[selected].value;
        //Preserve the value that was in there
        try {
            var oldLocator = mozmill.remote.$(id + "locator").value;
            var oldLocatorType = mozmill.remote.$(id + "locatorType").value;

        }
        catch(err) {
            //throw it away 
            }
        var newAction = this.buildAction(method, {
            'uuid': id
        });
        mozmill.remote.$(id).innerHTML = newAction.innerHTML;
        //only try to replace them if this particular action had a locator to begin with
        try {
            if (typeof(oldLocator) != 'undefined') {
                mozmill.remote.$(id + "locator").value = oldLocator;
                mozmill.remote.$(id + "locatorType").value = oldLocatorType;
            }
        }
        catch(err) {
            //throw it away
        }

        //safari hack for resizing the suite div to accomodate the new action
        mozmill.remote.$(id).style.height = '';

    };

    this.setRemoteElem = function(id) {
        this.selectedElement = id;

    };

    this.addActionAbove = function(uuid) {
        var newAction = this.buildAction(null, {});
        var parent = mozmill.remote.$(uuid).parentNode;
        parent.insertBefore(newAction, mozmill.remote.$(uuid));
        //IE hack
        if (mozmill.browser.isIE) {
            mozmill.remote.$(newAction.id).innerHTML = newAction.innerHTML;
        }
        else {
            mozmill.remote.$(newAction.id + "locator").focus();
        }

        fleegix.fx.fadeIn(mozmill.remote.$(newAction.id));

    };

    this.addActionBelow = function(uuid) {
        var newAction = this.buildAction(null, {});
        var parent = mozmill.remote.$(uuid).parentNode;
        parent.insertBefore(newAction, mozmill.remote.$(uuid).nextSibling);
        //IE Hack
        if (mozmill.browser.isIE) {
            mozmill.remote.$(newAction.id).innerHTML = newAction.innerHTML;
        }
        else {
            mozmill.remote.$(newAction.id + "locator").focus();
        }

        fleegix.fx.fadeIn(mozmill.remote.$(newAction.id));

    };

    this.deleteAction = function(uuid) {
        //input_box=mozmill.remote.confirm("Are you sure you want to continue deleting?");
        //if (input_box==true) {
        fleegix.fx.fadeOut(mozmill.remote.$(uuid));
        d = function() {
            var pElement = mozmill.remote.$(uuid).parentNode;
            pElement.removeChild(mozmill.remote.$(uuid));

            //So that we don't leave the selected element
            //variable turned on when there are no actions in the IDE
            if (pElement.id == 'ideForm') {
                mozmill.ui.remote.selectedElement = null;

            }

        };
        setTimeout("d()", 800);

    };

    this.addAction = function(action) {
        var suite = this.getSuite();
        if (typeof(action) == 'undefined') {
            var action = this.buildAction(null, {});

        }
        //A hack to make it draw the UI correctly in IE
        suite.appendChild(action);
        if (mozmill.browser.isIE) {
            mozmill.remote.$(action.id).innerHTML = action.innerHTML;
        }
        else {
            mozmill.remote.$(action.id + "locator").focus();
        }
        return action.id;

    };

    this.getSuite = function(suiteName) {

        if (!suiteName) {
            var suiteName = 'recordingSuite' + mozmill.ui.recordSuiteNum;
        }

        var suite = mozmill.remote.$(suiteName);
        if (suite == null) {
            var ide = mozmill.remote.$('ideForm');
            suite = mozmill.remote.document.createElement('div');
            suite.style.position = 'relative';
            suite.id = suiteName;

            if (mozmill.browser.isIE) {
                var vWidth = mozmill.remote.fleegix.dom.getViewportWidth();
                suite.style.width = (vWidth - 22) + 'px';

            }
            else {
                suite.style.width = "99%";
            }
            suite.style.background = "lightblue";
            suite.style.overflow = 'hidden';
            //suite.style.height='40px';
            suite.style.border = '1px solid black';
            suite.innerHTML = "<table style='width:100%;font:12px arial;'><tr><td><strong>Suite </strong>" + suiteName + 
            "</td><td><span align=\"right\" style='top:0px;float:right;'><a href=\"#\" onclick=\"mozmill.ui.playback.sendPlayBack(null,\'" + suiteName + 
            "\')\">[play]</a>&nbsp<a href=\"#\" onclick=\"mozmill.ui.remote.saveSuite(\'" + suiteName + 
            "\')\">[save]</a>&nbsp<a href=\"#\" onclick=\"mozmill.ui.remote.deleteAction(\'" + suiteName + 
            "\')\">[delete]</a>&nbsp<a href=\"#\" onclick=\"javascript:mozmill.ui.toggleCollapse(\'" + suiteName + 
            "\')\">[hide/show]</a></span></td></tr></table>";

            //Append the new suite to the IDE
            mozmill.remote.$('ideForm').appendChild(suite);

            try {
                //If the last suite is expanded, collapse it
                if (mozmill.remote.$(suite.id).previousSibling.style.height != '18px') {
                    mozmill.ui.toggleCollapse(mozmill.remote.$(suite.id).previousSibling.id);

                }

            }
            catch(err) {
                //there wasn't a previous suite
                }

        }
    //    var dragsort = ToolMan.dragsort()
      //  var junkdrawer = ToolMan.junkdrawer()
    //    dragsort.makeListSortable(mozmill.remote.$(suite.id), verticalOnly, saveOrder)

        return suite;

    };


    //Send the suite to save to the backend and receive an url for the user to save
    this.saveSuite = function(id) {
        var suite = mozmill.remote.$(id);
        var testArray = [];

        if (suite.hasChildNodes()) {
            for (var j = 1; j < suite.childNodes.length; j++) {
                //console.log(suites[i].childNodes[j].id);
                var actionObj = {};
                actionObj.suite_name = suite.id;
                actionObj.version = "0.1";

                if (mozmill.remote.$(suite.childNodes[j].id + 'params') != null) {
                    actionObj.method = mozmill.remote.$(suite.childNodes[j].id + 'method').value;
                    actionObj.params = eval('(' + mozmill.remote.$(suite.childNodes[j].id + 'params').value + ')');

                }
                else {
                    var si = mozmill.remote.$(suite.childNodes[j].id + 'method').selectedIndex;
                    actionObj.method = mozmill.remote.$(suite.childNodes[j].id + 'method')[si].value;
                    var paramsObj = {};
                    paramsObj.uuid = suite.childNodes[j].id;

                    if (mozmill.registry.methods[actionObj.method].locator) {
                        var si = mozmill.remote.$(suite.childNodes[j].id + 'locatorType').selectedIndex;
                        paramsObj[mozmill.remote.$(suite.childNodes[j].id + 'locatorType')[si].value] = mozmill.remote.$(suite.childNodes[j].id + 'locator').value;

                    }
                    if (mozmill.registry.methods[actionObj.method].option) {
                        var si = mozmill.remote.$(suite.childNodes[j].id + 'optionType').selectedIndex;
                        if (actionObj.method.split(".")[0] == 'waits') {
                            paramsObj[mozmill.remote.$(suite.childNodes[j].id + 'optionType')[si].value] = parseInt(mozmill.remote.$(suite.childNodes[j].id + 'option').value);

                        }
                        else {
                            paramsObj[mozmill.remote.$(suite.childNodes[j].id + 'optionType')[si].value] = mozmill.remote.$(suite.childNodes[j].id + 'option').value;

                        }

                    }
                    actionObj.params = paramsObj;

                }

                //var str = fleegix.json.serialize(actionObj);
                testArray.push(actionObj);
            }

            var respRun = function(str) {
                //alert(str);
                response = eval('(' + str + ')');
                //window.open(response.result,'Saved Test','width=400,height=600')
                //window.open(response.result);
                window.open(response.result, null, "height=500,width=600,status=no,toolbar=no,menubar=no,location=no,resizable=yes");
                return true;
            }

            //Get the language to save these suckers in
            var langSI = mozmill.remote.$('suiteSaveFormat').selectedIndex;
            var lang = mozmill.remote.$('suiteSaveFormat')[langSI].value;

            var json_object = new json_call('1.1', 'create_save_file');
            var params_obj = {};
            params_obj.transformer = lang;
            params_obj.suite_name = id;
            params_obj.tests = testArray;
            json_object.params = params_obj;

            var json_string = fleegix.json.serialize(json_object)
            fleegix.xhr.doPost(respRun, '/mozmill-jsonrpc/', json_string);

        }
        else {
            mozmill.remote.alert('You need test actions to save!');
        }
    };

    //This function takes a method and it's params and returns a DOM
    //Element representing that action for the UI
    this.buildAction = function(method, params) {
        //if we just want a blank action
        //default to type for now so everything gets displayed
        if (method == null) {
            method = 'click';
            params.id = '';
        }
        //If no params were passed
        if (typeof(params) == 'undefined') {
            var params = {};
        }

        //var action = this.constructAction(method,'','',mozmill.registry.methods[method].option,parms[mozmill.registry.methods[method].option]);
        var action = mozmill.remote.document.createElement('div');
        if (typeof(params.uuid) == 'undefined') {
            var date = new Date();
            action.id = date.getTime();
        }
        else {
            action.id = params.uuid;
        }
        action.style.position = 'relative';
        action.style.border = '1px dashed #aaa';
        action.style.background = 'lightyellow';
        action.style.width = '100%';
        //action.style.height = '50px';
        //in the case that the method we are passsing in isn't in the registry, we can still display it
        //just without all the interactive UI elements
        if ((mozmill.registry.methods[method] == null) || (method == 'complex')) {
            var t = mozmill.remote.document.createElement('table');
            t.border = "0";
            t.cellspacing = "1";
            t.cellpadding = "0";
            t.style.font = "10px arial";
            t.style.width = "100%";
            //console.log(fleegix.json.serialize(params));
            var r = mozmill.remote.document.createElement("tr");
            var c = mozmill.remote.document.createElement("td");
            c.style.width = '95%';
            //c.innerHTML += '<input type="text" class="texta" size="35" id="'+action.id+'method" value="'+ method +'"/>';
            var i0 = mozmill.remote.document.createElement("input");
            i0.type = 'text';
            i0.id = action.id + 'method';
            i0.className = 'texta';
            i0.size = '40';
            i0.setAttribute('value', method);
            c.appendChild(i0);

            c.innerHTML += '&nbsp&nbsp&nbsp&nbsp<a alt="Start Playback" href="#"><img border=0 onclick="mozmill.ui.playback.sendPlayBack(\'' + action.id + 
            '\')" style="height:18px;width:18px;" src="img/play.png"></a><a alt="Delete Action" href="#">' + 
            '<img border=0 onclick="mozmill.ui.remote.deleteAction(\'' + action.id + '\')" style="height:18px;width:18px;" ' + 
            'src="img/trash.png"></a>';

            c.innerHTML += '<a onclick="mozmill.ui.remote.addActionAbove(\'' + action.id + 
            '\')" href="#"><img border=0 src="img/addup.png"></a><a onclick="mozmill.ui.remote.addActionBelow(\'' + action.id + 
            '\')" href="#"><img border=0 src="img/adddown.png"></a>';
            r.appendChild(c);

            //This makes it look better in IE
            c.innerHTML += '<br>';
            var i = mozmill.remote.document.createElement('input');
            i.type = 'text';
            i.id = action.id + 'params';
            i.className = 'texta';

            if (mozmill.browser.isIE) {
                i.setAttribute('value', fleegix.json.serialize(params));

            }
            else {
                i.value = fleegix.json.serialize(params);

            }

            c.appendChild(i);
            r.appendChild(c);
            t.appendChild(r);

            action.appendChild(t);
            return action;

        }

        //We need a table to format this
        var t = mozmill.remote.document.createElement('table');
        t.border = "0";
        t.cellspacing = "1";
        t.cellpadding = "0";
        t.width = '100%';
        t.style.font = "10px arial";


        var r = mozmill.remote.document.createElement("tr");
        var c = mozmill.remote.document.createElement("td");

        c.innerHTML += 'Method: ';
        r.appendChild(c);
        //Setup the method drop down
        var s = mozmill.remote.document.createElement('select');
        s.className = 'smalloption';
        s.style.font = '13px arial';
        s.id = action.id + 'method';
        //Setup default method
        var o = mozmill.remote.document.createElement('option');
        o.value = method;
        o.selected = 'selected';
        o.innerHTML += method;
        s.appendChild(o);

        //Setup methods option  
        for (var m in mozmill.registry.methods) {
            var o = mozmill.remote.document.createElement('option');
            o.value = m;
            o.innerHTML += m;
            s.appendChild(o);

        }
        s.setAttribute("onchange", "mozmill.ui.remote.methodChange('" + action.id + "');");

        var c = mozmill.remote.document.createElement("td");
        c.colSpan = "2";
        c.appendChild(s);

        c.innerHTML += '&nbsp&nbsp&nbsp&nbsp&nbsp<a alt="Start Playback" href="#"><img border=0 onclick="mozmill.ui.playback.sendPlayBack(\'' + action.id + 
        '\')" style="height:18px;width:18px;" src="img/play.png"></a><a alt="Delete Action" href="#">' + 
        '<img border=0 onclick="mozmill.ui.remote.deleteAction(\'' + action.id + '\')" style="height:18px;width:18px;" ' + 
        'src="img/trash.png"></a><a onclick="mozmill.ui.remote.addActionAbove(\'' + action.id + 
        '\')" href="#"><img border=0  src="img/addup.png"></a><a onclick="mozmill.ui.remote.addActionBelow(\'' + action.id + 
        '\')" href="#"><img border=0  src="img/adddown.png"></a>';
        if (mozmill.browser.isIE) {
            c.innerHTML += '<br>';

        }
        r.appendChild(c);
        t.appendChild(r);

        //If this method needs a locator
        if (mozmill.registry.methods[method].locator) {
            var r = mozmill.remote.document.createElement("tr");
            r.id = action.id + 'locatorRow';
            var c = mozmill.remote.document.createElement("td");
            c.innerHTML += 'Locater: ';
            r.appendChild(c);

            var locator = null;

            if (params['id']) {
                locator = 'id';
            }
            if (params['jsid']) {
                locator = 'jsid';
            }
            if (params['name']) {
                locator = 'name';
            }
            if (params['link']) {
                locator = 'link';
            }
            if (params['xpath']) {
                locator = 'xpath';
            }


            //Setup second select
            var s1 = mozmill.remote.document.createElement('select');
            s1.className = 'smalloption';
            s1.id = action.id + 'locatorType';

            var o1 = mozmill.remote.document.createElement('option');
            o1.selected = 'selected';
            if (locator) {
                o1.value = locator;
                o1.innerHTML += locator;

            }
            s1.appendChild(o1);

            for (var i = 0; i < mozmill.registry.locator.length; i++) {
                var o1 = mozmill.remote.document.createElement('option');
                o1.value = mozmill.registry.locator[i];
                o1.innerHTML += mozmill.registry.locator[i];
                s1.appendChild(o1);

            }

            var c = mozmill.remote.document.createElement("td");
            c.colSpan = '3';
            c.appendChild(s1);
            c.innerHTML += '&nbsp';

            //Add the text box
            var i0 = mozmill.remote.document.createElement('input');
            i0.name = 'locValue';
            i0.className = 'texta';
            i0.width = '105';
            //Dont know why I have to do this.. but it wont work if its not setattrib
            if (params[locator]) {
                i0.setAttribute('value', params[locator]);

            }
            i0.id = action.id + 'locator';
            //in firefox there was a bug moving the focus to the element we clicked, not sure why
            //but this seems to fix it. 
          /*  if (!mozmill.browser.isIE) {
                i0.setAttribute('onFocus', 'mozmill.ui.remote.setRemoteElem(\'' + i0.id + '\')');
                i0.setAttribute('onClick', 'mozmill.remote.$(\'' + i0.id + '\').focus();');
            }
        */
            c.appendChild(i0);
            r.appendChild(c);
            t.appendChild(r);

        }
        //if its an action that takes no params at all set a min height
        else {
            t.style.height = '40px';
        }

        //If this method has a option
        if (mozmill.registry.methods[method].option != false) {
            var r = mozmill.remote.document.createElement("tr");
            r.id = action.id + 'optionRow';
            var c = mozmill.remote.document.createElement("td");
            if (mozmill.browser.isIE) {
                c.innerHTML += '<br>Option: ';
            }
            else {
                c.innerHTML += 'Option: ';
            }
            r.appendChild(c);

            //Setup third select
            var s2 = mozmill.remote.document.createElement('select');
            s2.className = 'smalloption';
            s2.id = action.id + 'optionType';

            var o2 = mozmill.remote.document.createElement('option');
            if (typeof(mozmill.registry.methods[method].option) != 'undefined') {
                o2.value = mozmill.registry.methods[method].option;

            }
            o2.selected = 'selected';
            o2.innerHTML += mozmill.registry.methods[method].option;
            s2.appendChild(o2);

            var o2 = mozmill.remote.document.createElement('option');
            o2.value = '';
            o2.innerHTML += '';
            s2.appendChild(o2);

            //This will give you a list of all the possible options
            //Keeping this here unless I find a reason to put it back/use it	
            /*for(var i=0;i<mozmill.registry.option.length;i++){
      	var o2 = mozmill.remote.document.createElement('option');
      	o2.value = mozmill.registry.option[i];
      	o2.innerHTML += mozmill.registry.option[i];
      	s2.appendChild(o2);
      }*/
            var c = mozmill.remote.document.createElement("td");
            c.colSpan = '3';
            c.appendChild(s2);
            r.appendChild(c);

            //Add the text box
            var i1 = mozmill.remote.document.createElement('input');
            i1.name = 'optValue';
            i1.className = 'texta';
            i1.size = '40';
            if (typeof(params[mozmill.registry.methods[method].option]) != 'undefined') {
                i1.setAttribute("value", params[mozmill.registry.methods[method].option]);

            }
            i1.id = action.id + 'option';
       /*     if (!mozmill.browser.isIE) {
                i1.setAttribute('onFocus', 'mozmill.ui.remote.setRemoteElem(\'' + i1.id + '\')');
                i1.setAttribute('onClick', 'mozmill.remote.$(\'' + i1.id + '\').focus();');                
            }
        */
            c.appendChild(i1);
            r.appendChild(c);
            t.appendChild(r);

        }

        action.appendChild(t);
        if (mozmill.browser.isIE) {
            action.innerHTML = t.innerHTML;
        }
        return action;

    }

};