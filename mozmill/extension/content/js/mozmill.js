var $ = function(id) {
  return document.getElementById(id);
};

var mozmill = new function(){
  this.newBrowser = function(){
    var newWin = this.testWindow.open(''+this.testWindow.location,'', 
    'left=20,top=20,width=500,height=500,toolbar=1,resizable=0');
    var newController = new mozmill.MozMillController(newWin);
    return newController;
  }
  this.MozMillController = function(windowObj){
    this.win = windowObj;
    return this;
  }
  this.hiddenWindow = Components.classes["@mozilla.org/appshell/appShellService;1"]
           .getService(Components.interfaces.nsIAppShellService)
           .hiddenDOMWindow;
};

var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
                   .getService(Components.interfaces.nsIWindowMediator);
mozmill.testWindow = wm.getMostRecentWindow("navigator:browser");
mozmill.controller = new mozmill.MozMillController(mozmill.testWindow);
mozmill.testWindow.mozmill = mozmill;

