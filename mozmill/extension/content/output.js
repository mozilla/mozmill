// ***** BEGIN LICENSE BLOCK *****
// Version: MPL 1.1/GPL 2.0/LGPL 2.1
// 
// The contents of this file are subject to the Mozilla Public License Version
// 1.1 (the "License"); you may not use this file except in compliance with
// the License. You may obtain a copy of the License at
// http://www.mozilla.org/MPL/
// 
// Software distributed under the License is distributed on an "AS IS" basis,
// WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
// for the specific language governing rights and limitations under the
// License.
// 
// The Original Code is Mozilla Corporation Code.
// 
// The Initial Developer of the Original Code is
// Adam Christian.
// Portions created by the Initial Developer are Copyright (C) 2008
// the Initial Developer. All Rights Reserved.
// 
// Contributor(s):
//  Adam Christian <adam.christian@gmail.com>
//  Mikeal Rogers <mikeal.rogers@gmail.com>
// 
// Alternatively, the contents of this file may be used under the terms of
// either the GNU General Public License Version 2 or later (the "GPL"), or
// the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
// in which case the provisions of the GPL or the LGPL are applicable instead
// of those above. If you wish to allow use of your version of this file only
// under the terms of either the GPL or the LGPL, and not to allow others to
// use your version of this file under the terms of the MPL, indicate your
// decision by deleting the provisions above and replace them with the notice
// and other provisions required by the GPL or the LGPL. If you do not delete
// the provisions above, a recipient may use your version of this file under
// the terms of any one of the MPL, the GPL or the LGPL.
// 
// ***** END LICENSE BLOCK *****

var arrays = {}; Components.utils.import('resource://mozmill/stdlib/arrays.js', arrays);
var json2 = {}; Components.utils.import('resource://mozmill/stdlib/json2.js', json2);

var $ = function(id) {
   return document.getElementById(id);
};

var createCell = function (t, obj, message) {

  var r = window.document.getElementById("resOut");
  var msg = window.document.createElement('html:div');
  msg.setAttribute("class", t);
  //msg.style.background = color;
  //var serialized = json2.JSON.stringify(message);
  msg.setAttribute("style", "font-weight:bold;display:block;height:15px;overflow:hidden;width:100%;");
  
  //Adding each of the message attributes dynamically
  //if message isn't an object
  if (typeof(message) == "string"){
    msg.textContent = t+' :: '+message;
  }
  else {
    //add each piece in its own hbox
    msg.textContent = t+' :: '+message['function'] + ' +';
    
    //For each attribute
    for (i in message){
      //if the value isn't undefined
      if (message[i] != undefined){
        var stuff = window.document.createElement('html:div');
        stuff.setAttribute("style", "font-weight:normal;display:block");
        stuff.textContent = i +": " +message[i];
        stuff.style.width = "100%";
        msg.appendChild(stuff);
      }
    }
  }
  
  //Add the event listener for clicking on the box to see more info
  msg.addEventListener('click', function(e){

    if (e.which == 3){
      copyToClipboard(e.target.parentNode.textContent);
      alert('Copied to clipboard...')
      return;
    }
    
    if (e.target.style.height == "15px"){
      e.target.style.overflow = "";
      e.target.style.height = "";
    }
    else { 
      e.target.style.height = "15px";
      e.target.style.overflow = "hidden";
    }
  }, true);
    
  r.insertBefore(msg, r.childNodes[0]);
  updateOutput();
}

var frame = {}; Components.utils.import('resource://mozmill/modules/frame.js', frame);
// var utils = {}; Components.utils.import('resouce://mozmill/modules/utils.js', utils);

// Set UI Listeners in frame
function stateListener (state) {
  if (state != 'test') {  
    $('runningStatus').textContent = state;
    // results.write(state)
  }
}
frame.events.addListener('setState', stateListener);
function testListener (test) {
  createCell('test', test, 'Started running test: '+test.name)
  $('runningStatus').textContent = 'Running test: '+test.name;
}
frame.events.addListener('setTest', testListener);
function passListener (text) {
  createCell('pass', text, text)
}
frame.events.addListener('pass', passListener);
function failListener (text) {
  createCell('fail', text, text)
}
frame.events.addListener('fail', failListener);
function logListener (obj) {
  createCell('log', obj, obj)
}
frame.events.addListener('log', logListener);
function loggerListener (obj) {
  createCell('logger', obj, obj)
}
frame.events.addListener('logger', loggerListener);

