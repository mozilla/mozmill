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

var inspection = {}; Components.utils.import('resource://mozmill/modules/inspection.js', inspection);
var utils = {}; Components.utils.import('resource://mozmill/modules/utils.js', utils);
var objects = {}; Components.utils.import('resource://mozmill/stdlib/objects.js', objects);
var arrays = {}; Components.utils.import('resource://mozmill/stdlib/arrays.js', arrays);
var events = {}; Components.utils.import('resource://mozmill/modules/events.js', events);
var logging = {}; Components.utils.import('resource://mozmill/stdlib/logging.js', logging);

var recorderLogger = logging.getLogger('recorderLogger');

var currentRecorderArray = [];

var getEventSet = function (eArray) {
  var inSet = function (a, c) {
    for each(x in a) {
      if (x.evt.timeStamp == c.evt.timeStamp && c.evt.type == x.evt.type) {
        return true;
      }
    }
    return false;
  }
  
  var returnArray = [];
  for each(e in eArray) {
    // recorderLogger.info('ts '+e.evt.timeStamp+' '+inSet(returnArray, e))
    if (!inSet(returnArray, e)) {
      returnArray.push(e);
    }
  }
  return returnArray;
}

var recorderMethodCases = {
  'click': function (x) {return 'click('+x['inspected'].elementText+')';},
  'keypress': function (x) {
    return 'keypress(' + x['inspected'].elementText + ',' + x['evt'].charCode + ',' +x['evt'].ctrlKey 
            + ','+ x['evt'].altKey + ',' + x['evt'].shiftKey + ',' + x['evt'].metaKey + ')';
            },
  'change': function (x) {return 'type('+x['inspected'].elementText+',"'+x['evt'].target.value+'")';},
  'dblclick': function (x) {return 'dblclick('+x['inspected'].elementText+')';},
}

var cleanupEventsArray = function (recorder_array) {
  var indexesForRemoval = [];
  var type_indexes = [x['evt'].type for each(x in recorder_array)];
  
  // Convert a set of keypress events to a single type event
  if (arrays.inArray(type_indexes, 'change')) {
    var offset = 0;
    while (arrays.indexOf(type_indexes, 'change', offset) != -1) {
      var eIndex = arrays.indexOf(type_indexes, 'change', offset);
      var e = recorder_array[eIndex];
      if (arrays.compare(e['evt'].target.value, 
        [String.fromCharCode(x['evt'].charCode) for 
        each(x in recorder_array.slice(eIndex - (e['evt'].target.value.length + 1) ,eIndex - 1))
        ])) {
          var i = eIndex - (e['evt'].target.value.length + 1)
          while (i < eIndex) {
            indexesForRemoval.push(i); i++;            
          }
        } else if (arrays.compare(e['evt'].target.value, 
        [String.fromCharCode(x['evt'].charCode) for 
        each(x in recorder_array.slice(eIndex - (e['evt'].target.value.length) ,eIndex - 1))
        ])) {
          var i = eIndex - (e['evt'].target.value.length )
          while (i < eIndex) {
            indexesForRemoval.push(i); i++;
          }
        }
      var offset = arrays.indexOf(type_indexes, 'change', offset) + 1;
    }
  }
  
  // Cleanup trailing cmd+~
  var i = 1;
  while (recorder_array[recorder_array.length - i]['inspected'].controllerText == 'new mozmill.controller.MozMillController(mozmill.utils.getWindowByTitle("MozMill IDE"))') {
    i++;
    if (recorder_array[recorder_array.length - i]['evt'].charCode == 96) {
      indexesForRemoval.push(recorder_array.length - i);
    }   
  }
  
  // Remove any actions in the mozmill window
  for (i in recorder_array) {
    var inspected = recorder_array[i]['inspected'];
    if (inspected.controllerText == 'new mozmill.controller.MozMillController(mozmill.utils.getWindowByTitle("MozMill IDE"))') {
      indexesForRemoval.push(i);
    }
  }
  
  var narray = [];
  for (i in recorder_array) {
    if (!arrays.inArray(indexesForRemoval, i)) {
      narray.push(recorder_array[i])
    }
  }
    
  return narray;
}

var getRecordedScript = function (recorder_array) {
  var setup = {};
  var test = [];
  
  var recorder_array = cleanupEventsArray(getEventSet(recorder_array));
  
  for each(x in recorder_array) {
    var inspected = x['inspected'];
    if (!setup[inspected.controllerText]) {
      if (objects.getLength(setup) > 0) {
        var ext = String(objects.getLength(setup) + 1);
      } else {
        var ext = '';
      }
      setup[inspected.controllerText] = 'controller'+ext
    }
    if (recorderMethodCases[x['evt'].type] == undefined) {
      alert("Don't have a case for event type: "+x['evt'].type)
    }
    var methodString = recorderMethodCases[x['evt'].type](x).replace(inspected.documentString, inspected.documentString.replace('controller.', setup[inspected.controllerText]+'.'))
    test.push(setup[inspected.controllerText]  + '.' + methodString + ';');
  }
  
  var rscript = [
    "var mozmill = {}; Components.utils.import('resource://mozmill/modules/mozmill.js', mozmill);",
    "var elementslib = {}; Components.utils.import('resource://mozmill/modules/elementslib.js', elementslib);",
    '', 'var setupModule = function(module) {',
  ];
  for (i in setup) {
    rscript.push("  "+setup[i]+' = '+i+';')
  }
  rscript.push('}')
  rscript.push('')
  rscript.push('var testRecorded = function () {')
  for each(t in test){
    rscript.push('  '+t);
  }
  rscript.push('}')
  return rscript.join('\n');
}

var RecorderConnector = function() {
  this.lastEvent = null;
}

RecorderConnector.prototype.toggle = function(){
  if ($('recorder').getAttribute('label') ==  'Stop'){
    this.off();
  } else{ this.on(); }
};

RecorderConnector.prototype.dispatch = function(evt){
  currentRecorderArray.push({'evt':evt, 'inspected':inspection.inspectElement(evt)});
  window.document.getElementById('editorInput').value += (evt.type + ':: ' + evt.timeStamp + '\n');
  //window.document.getElementById('editorInput').value += evt.type+'\n';
}

//Recursively bind to all the iframes and frames within
RecorderConnector.prototype.bindListeners = function(frame) {
  //Make sure we haven't already bound anything to this frame yet
  this.unbindListeners(frame);
  
  frame.addEventListener('click', this.dispatch, true);
  frame.addEventListener('dblclick', this.dispatch, true);
  frame.addEventListener('change', this.dispatch, true);
  frame.addEventListener('keypress', this.dispatch, true);
  
  var iframeCount = frame.window.frames.length;
  var iframeArray = frame.window.frames;

  for (var i = 0; i < iframeCount; i++)
  {
      try {
        iframeArray[i].addEventListener('click', this.dispatch, true);
        iframeArray[i].addEventListener('dblclick', this.dispatch, true);
        iframeArray[i].addEventListener('change', this.dispatch, true);
        iframeArray[i].addEventListener('keypress', this.dispatch, true);
        this.bindListeners(iframeArray[i]);
      }
      catch(error) {}
  }
}

//Recursively bind to all the iframes and frames within
RecorderConnector.prototype.unbindListeners = function(frame) {
  frame.removeEventListener('click', this.dispatch, true);
  frame.removeEventListener('dblclick', this.dispatch, true);
  frame.removeEventListener('change', this.dispatch, true);
  frame.removeEventListener('keypress', this.dispatch, true);
  
  var iframeCount = frame.window.frames.length;
  var iframeArray = frame.window.frames;

  for (var i = 0; i < iframeCount; i++)
  {
      try {
        iframeArray[i].removeEventListener('click', this.dispatch, true);
        iframeArray[i].removeEventListener('dblclick', this.dispatch, true);
        iframeArray[i].removeEventListener('change', this.dispatch, true);
        iframeArray[i].removeEventListener('keypress', this.dispatch, true);
        this.unbindListeners(iframeArray[i]);
      }
      catch(error) {}
  }
}

//When a new win dom window gets opened
RecorderConnector.prototype.observer = {
  observe: function(subject,topic,data){
    //Attach listener to new window here
    MozMillrec.bindListeners(subject);
  }
};

RecorderConnector.prototype.on = function() {
  //Bind
  if (($('saveMenu').getAttribute("disabled") != "true" && 
      window.document.getElementById('editorInput').value != '') || (
      window.document.getElementById('editorInput').value != '' &&
      window.openFn == null)){
    var confirmation = confirm('You have unsaved code in the test editor. The Recorder will replace the test you currently have in the test editor if you decide to continue. Would you like to continue regardless?');
  } else {
    var confirmation = true;
  }
  
  if (!confirmation) { return false;}
  $('saveMenu').setAttribute("disabled", "true"); 
  $('editorMessage').innerHTML = "Use the 'File' menu to open a test, or generate and save a new one..";
  window.openFn = null;
  
  for each(win in utils.getWindows()) {
    this.bindListeners(win);
  }
  //Update UI
  $('recorder').setAttribute('label', 'Stop');
  var mmWindows = utils.getWindows('navigator:browser');
  if (mmWindows.length != 0){
    mmWindows[0].focus();
  }
  
  var observerService =
    Components.classes["@mozilla.org/observer-service;1"]
      .getService(Components.interfaces.nsIObserverService);
  
  //Attach the new window open listener
  observerService.addObserver(this.observer, "toplevel-window-ready", false);
  
  currentRecorderArray = [];
  window.document.getElementById('editorInput').value = '';
};

RecorderConnector.prototype.off = function() {
  //Bind
  for each(win in utils.getWindows()) {
    this.unbindListeners(win);
  }
  $('recorder').setAttribute('label', 'Record');
  var r = getRecordedScript(currentRecorderArray);
  window.document.getElementById('editorInput').value = r;
  currentRecorderArray = [];
  //remove new window listener
  observerService.removeObserver(this.observer, "toplevel-window-ready");
};

var MozMillrec = new RecorderConnector();

// Scoping bug workarounds
var enableRec = function () {
  MozMillrec.on();
}
var disableRec = function () {
  MozMillrec.off();
}