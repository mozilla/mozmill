/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var frame = {}; Components.utils.import('resource://mozmill/modules/frame.js', frame);


function getBasename(path){
  var splt = "/"
  if (navigator.platform.indexOf("Win") != -1){
    splt = "\\";
  }
  var pathArr = path.split(splt);
  return pathArr[pathArr.length-1]
}

function openFile(){
  var openObj = utils.openFile(window);
  if (openObj) {
    $("#tabs").tabs("select", 0);
    var index = editor.getTabForFile(openObj.path);
    if(index != -1)
      editor.switchTab(index);
    else
      editor.openNew(openObj.data, openObj.path);
  }
}

function saveAsFile() {
  var content = editor.getContent();
  var filename = utils.saveAsFile(window, content);
  if (filename) {
    $("#tabs").tabs("select", 0);
    editor.changeFilename(filename);
    saveToFile();
    return true;
  }
  return false;
}

function saveToFile() {
  var filename = editor.getFilename();
  var content = editor.getContent();
  utils.saveFile(window, content, filename);
  editor.onFileSaved();
}

function saveFile() {
  var filename = editor.getFilename();
  if(/mozmill\.utils\.temp/.test(filename))
    saveAsFile();
  else {
    saveToFile();
  }
}

function closeFile() {
  $("#tabs").tabs("select", 0);
  var really = confirm("Are you sure you want to close this file?");
  if (really == true)
    editor.closeCurrentTab();
}

function runFile(){
  var nsIFilePicker = Components.interfaces.nsIFilePicker;
  var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
  fp.init(window, "Select a File", nsIFilePicker.modeOpen);
  fp.appendFilter("JavaScript Files","*.js");
  var res = fp.show();
  if (res == nsIFilePicker.returnOK){
    $("#tabs").tabs("select", 1);
    frame.runTestFile(fp.file.path, true);
  }
  testFinished();
}

function runEditor(){
  saveToFile();
  var filename = editor.getFilename();
  frame.runTestFile(filename);
  testFinished();
}

function newFile(){
  editor.openNew();
}

function newTemplate(){
  var template = "var setupModule = function(module) {\n" +
   "  module.controller = mozmill.getBrowserController();\n" +
   "}\n" +
   "\n" +
   "var testFoo = function(){\n" +
   "  controller.open('http://www.google.com');\n" +
   "}\n";
  editor.openNew(template);
}

function tabSelected(selector) {
  editor.switchTab(selector.selectedIndex);
}

function openHelp() {
  var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]  
                         .getService(Components.interfaces.nsIWindowMediator);  
  var browser = wm.getMostRecentWindow("navigator:browser").getBrowser();
  browser.selectedTab =
    browser.addTab("http://quality.mozilla.org/docs/mozmill/getting-started/");
}

