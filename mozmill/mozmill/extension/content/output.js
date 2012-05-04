/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var arrays = {}; Components.utils.import('resource://mozmill/stdlib/arrays.js', arrays);
var json2 = {}; Components.utils.import('resource://mozmill/stdlib/json2.js', json2);
var utils = {}; Components.utils.import('resource://mozmill/stdlib/utils.js', utils);

var aConsoleService = Components.classes["@mozilla.org/consoleservice;1"].
     getService(Components.interfaces.nsIConsoleService);


var createCell = function (t, obj, message) {
  // try {
  //    alert(json2.JSON.stringify(message.exception.message));
  //  } catch(err){}
  //  //alert(msgObj.exception.message);
  //  
  var r = document.getElementById("resOut");
  var msg = document.createElement('div');
  msg.setAttribute("class", t);
  if (t == "fail"){
    $(msg).addClass("ui-state-error ui-corner-all");
  }
  if (t == "pass"){
    $(msg).addClass("ui-state-highlight ui-corner-all");
    msg.style.background = "lightgreen";
    msg.style.border = "1px solid darkgreen";
  }
  else {
    $(msg).addClass("ui-state-highlight ui-corner-all");
  }
  msg.style.height = "15px";
  msg.style.overflow = "hidden";
  
  //if message isn't an object
  if (typeof(message) == "string"){
    msg.innerHTML = "<strong>"+t+"</strong>"+' :: '+message;
  }
  else {
    try {
      var display = message.exception.message;
      if (display == undefined) {
        var display = message.exception;
      }
    } catch(err){ 
      var display = message['function'];
    }
    //add each piece in its own hbox
    msg.innerHTML = '<span style="float:right;top:0px;cursor: pointer;" class="ui-icon ui-icon-triangle-1-s"/>';
    msg.innerHTML += "<strong>"+t+"</strong>"+' :: '+display;
    
    var createTree = function(obj){
      var mainDiv = document.createElement('div');
      for (prop in obj){
        var newDiv = document.createElement('div');
        newDiv.style.position = "relative";
        newDiv.style.height = "15px";
        newDiv.style.overflow = "hidden";
        newDiv.style.width = "95%";
        newDiv.style.left = "10px";
        //some properties don't have a length attib
        try {
          if (obj[prop] && obj[prop].length > 50){
            newDiv.innerHTML = '<span style="float:right;top:0px;cursor: pointer;" class="ui-icon ui-icon-triangle-1-s"/>';
          }
        } catch(e){}
        
        newDiv.innerHTML += "<strong>"+prop+"</strong>: "+obj[prop];
        mainDiv.appendChild(newDiv);
      }
      return mainDiv;
    }
    //iterate the properties creating output entries for them
    for (prop in message){
      if (typeof message[prop] == "object"){
        var newDiv = createTree(message[prop]);
      }
      else {
        var newDiv = document.createElement('div');
        newDiv.innerHTML = "<strong>"+prop+"</strong>: "+message[prop];
      }
      newDiv.style.position = "relative";
      newDiv.style.left = "10px";
      newDiv.style.overflow = "hidden";
      
      msg.appendChild(newDiv);
    }
   
  }
  
  //Add the event listener for clicking on the box to see more info
  msg.addEventListener('click', function(e){
    // if (e.which == 3){
    //    var rout = document.getElementById('resOut');
    //    if (e.target.parentNode != rout){
    //      copyToClipboard(e.target.parentNode.innerHTML);
    //    }
    //    else {
    //      copyToClipboard(e.target.innerHTML);
    //    }
    //    alert('Copied to clipboard...')
    //    return;
    //  }
    if (e.target.tagName == "SPAN"){
      if (e.target.parentNode.style.height == "15px"){
        e.target.parentNode.style.overflow = "";
        e.target.parentNode.style.height = "";
        e.target.className = "ui-icon ui-icon-triangle-1-n";
      }
      else { 
        e.target.parentNode.style.height = "15px";
        e.target.parentNode.style.overflow = "hidden";
        e.target.className = "ui-icon ui-icon-triangle-1-s";
      }
    }

  }, true);
  
  if (r.childNodes.length == 0){
   r.appendChild(msg);
  }
  else {
   r.insertBefore(msg, r.childNodes[0]);
  }
  updateOutput();
}

var frame = {}; Components.utils.import('resource://mozmill/modules/frame.js', frame);

// Set UI Listeners in frame

function stateListener (state) {
  if (state != 'test') {  
  //  utils.getWindowByTitle('MozMill IDE').document.getElementById('runningStatus').innerHTML = state;
  }
}
frame.events.addListener('setState', stateListener);
aConsoleService.logStringMessage('+++++++++++++++++++++++');
aConsoleService.logStringMessage("Current setStateListener size: "+String(frame.events.listeners.setState.length) );
function testListener (test) {
  createCell('test', test, 'Started running test: '+test.name);
}
frame.events.addListener('setTest', testListener);
function passListener (text) {
  createCell('pass', text, text);
}
frame.events.addListener('pass', passListener);
function failListener (text) {
  createCell('fail', text, text);
}
frame.events.addListener('fail', failListener);
function logListener (obj) {
  createCell('log', obj, obj);
}
frame.events.addListener('log', logListener);
function loggerListener (obj) {
  createCell('logger', obj, obj)
}
frame.events.addListener('logger', loggerListener);

function removeStateListeners(){
    frame.events.removeListener(testListener);
    frame.events.removeListener(passListener);
    frame.events.removeListener(failListener);
    frame.events.removeListener(logListener);
    frame.events.removeListener(loggerListener);
}
