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

var EXPORTED_SYMBOLS = ["write", "perf"];

var write = function(s, color){
 var win = null;
 var enumerator = Components.classes["@mozilla.org/appshell/window-mediator;1"]
                     .getService(Components.interfaces.nsIWindowMediator)
                     .getEnumerator("");
  while(enumerator.hasMoreElements()) {
    var win = enumerator.getNext();
    if (win.document.title == 'MozMill IDE'){
      win.focus();
      var r = win.document.getElementById("resOut");
      var msg = win.document.createElement('hbox');
      msg.setAttribute("class", "resultrow");
      if (typeof(color) != 'undefined'){
        msg.style.background = color;
      }
      else{
        msg.style.background = 'lightyellow';
      }
      msg.textContent = s;

      r.insertBefore(msg, r.childNodes[0]);
    }
  }
}

var perf = function(s){
 var win = null;
 var enumerator = Components.classes["@mozilla.org/appshell/window-mediator;1"]
                     .getService(Components.interfaces.nsIWindowMediator)
                     .getEnumerator("");
  while(enumerator.hasMoreElements()) {
    var win = enumerator.getNext();
    if (win.document.title == 'MozMill IDE'){
      win.focus();
      var r = win.document.getElementById("perfOut");
      var msg = win.document.createElement('hbox');
      msg.setAttribute("class", "resultrow");
      // if (typeof(color) != 'undefined'){
      //   msg.style.background = color;
      // }
      // else{
      //   msg.style.background = 'lightyellow';
      // }
      msg.style.background = 'lightyellow';
      msg.textContent = s;
      r.insertBefore(msg, r.childNodes[0]);
    }
  }
}


//Functions for writing status to the UI
/***************************************/
// mozmill.results = new
// function() {
// 
//     //Writing to the performance tab
//     this.writePerformance = function(str) {
//       var r = $("perfOut");
//       var msg = document.createElement('div');
//       msg.style.width = "100%";
//       msg.textContent = str;
//       r.insertBefore(msg, r.childNodes[0]);
//     }
// 
//     this.writeStatus = function(str) {
//       var s = $("runningStatus");
//       s.textContent = 'Status:' + str;
//     }
// 
//     //Writing to the results tab
//     this.writeResult = function(str, color) {
//       var r = $("resOut");
// 
//       var msg = document.createElement('hbox');
//       msg.setAttribute("class", "resultrow");
//       if (typeof(color) != 'undefined'){
//         msg.style.background = color;
//       }
//       else{
//         msg.style.background = 'lightyellow';
//       }
//       msg.textContent = str;
// 
//       r.insertBefore(msg, r.childNodes[0]);
//     }
// 
// 
// };