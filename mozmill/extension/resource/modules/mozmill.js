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
// Mikeal Rogers.
// Portions created by the Initial Developer are Copyright (C) 2008
// the Initial Developer. All Rights Reserved.
// 
// Contributor(s):
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

var EXPORTED_SYMBOLS = ["controller", "events", "utils", "elementslib",
                        "getBrowserController", "newBrowserController", "getAddonsController",
                        "getPreferencesController", "wm"];
                        
var controller = {};  Components.utils.import('resource://mozmill/modules/controller.js', controller);
var events = {};      Components.utils.import('resource://mozmill/modules/events.js', events);
var utils = {};       Components.utils.import('resource://mozmill/modules/utils.js', utils);
var elementslib = {}; Components.utils.import('resource://mozmill/modules/elementslib.js', elementslib);

var hwindow = Components.classes["@mozilla.org/appshell/appShellService;1"]
                .getService(Components.interfaces.nsIAppShellService)
                .hiddenDOMWindow;

var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
           .getService(Components.interfaces.nsIWindowMediator);

function newBrowserController () {
  return new controller.MozMillController(hwindow.OpenBrowserWindow());
}

function getBrowserController () {
  var browserWindow = wm.getMostRecentWindow("navigator:browser");
  if (browserWindow == null) {
    return newBrowserController();
  }
  else {
    return new controller.MozMillController(browserWindow);
  }
}

function getAddonsController () {
  hwindow.BrowserOpenAddonsMgr();
  return new controller.MozMillController(wm.getMostRecentWindow(''));
}

function getPreferencesController() {
  hwindow.openPreferences();
  controller.sleep(1000)
  return new controller.MozMillController(wm.getMostRecentWindow(''));
}

// hwindow.openPreferences()

// window.document.documentElement.getAttribute('windowtype')

// controller.window.document.getAnonymousElementByAttribute(controller.window.document.documentElement, 'anonid', 'selector')

// var $ = function(id) {
//   return document.getElementById(id);
// };
// 
// var mozmill = new function(){
//   this.ui = new function(){};
//   this.newBrowser = function(){
//     var newWin = this.testWindow.open(''+this.testWindow.location,'', 
//     'left=20,top=20,width=500,height=500,toolbar=1,resizable=0');
//     var newController = new mozmill.MozMillController(newWin);
//     return newController;
//   }
//   this.MozMillController = function(windowObj){
//     this.win = windowObj;
//     return this;
//   }
//   this.hiddenWindow = Components.classes["@mozilla.org/appshell/appShellService;1"]
//            .getService(Components.interfaces.nsIAppShellService)
//            .hiddenDOMWindow;
// };
// 
// var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
//                    .getService(Components.interfaces.nsIWindowMediator);
// mozmill.testWindow = wm.getMostRecentWindow("navigator:browser");
// mozmill.controller = new mozmill.MozMillController(mozmill.testWindow);
// mozmill.testWindow.mozmill = mozmill;

