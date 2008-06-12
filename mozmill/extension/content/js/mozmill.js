var $ = function(id) {
    return document.getElementById(id);
};
/*
var gWindowManagerListener = {
  onOpenWindow: function(aXULWindow) {
    alert('open');
  },
  onCloseWindow: function(aXULWindow) { alert('close'); },
  onWindowTitleChange: function(aXULWindow, aWindowTitle) { alert('title changed'); }
};

var gWindowManager = 
  Components.classes['@mozilla.org/appshell/window-mediator;1']
  .getService(Components.interfaces.nsIWindowMediator);

gWindowManager.addListener(gWindowManagerListener);
*/
var mozmill = new function(){
  this.testWindow = opener;
  this.running = true;
  this.remote = window;
};

opener.mozmill = mozmill;

var showPrefs = function(){
  var p = window.open("chrome://mozmill/content/prefs.xul", "", "chrome,modal,alwaysRaised,centerscreen,height=300,width=300");
}

var add = function(){
  var d = document.createElement('div');
  d.style.width = "100%";
  d.style.height = "50px";
  d.style.background = "lightyellow";
  d.style.border = "1px solid #aaa";
  document.getElementById('ideForm').appendChild(d);
}
var clear = function(){
  document.getElementById('ideForm').textContent = "";
}

var run = function(){
  var i = document.getElementById('shellInput');
  var r = eval(i.value);
  mozmill.ui.results.writeResult('Running '+i.value+', result:' + r);
  i.value = "";
}

/*var openFile = function(){
  const nsIFilePicker = Components.interfaces.nsIFilePicker;

  var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
  fp.init(window, "Select a Test Directory", nsIFilePicker.modeGetFolder);
  
  var rv = fp.show();
  if (rv == Components.interfaces.nsIFilePicker.returnOK){
    // file is the given directory (nsIFile)
    var array = [];
    //iterate directories recursively
    recurseDir = function(ent){
        var entries = ent;
        while(entries.hasMoreElements())
        {
          var entry = entries.getNext();
          entry.QueryInterface(Components.interfaces.nsIFile);
          if ((entry.isDirectory()) && (entry.path.indexOf('.svn') == -1)){
            recurseDir(entry.directoryEntries);
          }
          //push js files onto the array
          if (entry.path.indexOf('.js') != -1){
            array.push(entry.path);
          }
        }
    }
    //build the files array
    recurseDir(fp.file.directoryEntries);
    paramObj = {};
    paramObj.files = array;
    mozmill.controller.commands.jsTests(paramObj);
  }*/
  var openFile = function(){
    //define the interface
    var nsIFilePicker = Components.interfaces.nsIFilePicker;
    var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
    //define the file picker window
    fp.init(window, "Select a File", nsIFilePicker.modeOpen);
    fp.appendFilter("JavaScript Files","*.js");
    //show the window
    var res = fp.show();
    //if we got a file
    if (res == nsIFilePicker.returnOK){
      var thefile = fp.file;
      //create the paramObj with a files array attrib
      var paramObj = {};
      paramObj.files = [];
      paramObj.files.push(thefile.path);
      
      //Move focus to output tab
      $('mmtabs').setAttribute("selectedIndex", 2);
      //send it into the JS test framework to run the file
      mozmill.controller.commands.jsTests(paramObj);
    }
  };
