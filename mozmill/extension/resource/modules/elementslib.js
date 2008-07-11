// ***** BEGIN LICENSE BLOCK *****// ***** BEGIN LICENSE BLOCK *****
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

var EXPORTED_SYMBOLS = [""];//"Elem", "ID", "Link", "XPath", "Name"];

utils = Components.utils.import('resource://mozmill/modules/utils.js');

var ElemBase = function(){
  this.isElement = true;
}
ElemBase.prototype.exists = function(window){
  if (this.getNode(window)){ return true; }
  else{ return false; }
}

var Elem = function(node) {
  this.node = node;
}
Elem.prototype = new utils.Copy(ElemBase.prototype);
Elem.prototype.getNode = function (window) { return this.node; }

var ID = function(_document, nodeID) {
  this._document = _document;
  this.nodeID = nodeID;
}
ID.prototype = new utils.Copy(ElemBase.prototype);
ID.prototype.getNode = function (window) {
  // Adam please fill with code
}

var Link = function(_document, linkName) {
  this._document = _document;
  this.linkName = linkName;
}
Link.prototype = new utils.Copy(ElemBase.prototype);
Link.prototype.getNode = function (window) {
  // Adam please fill with code
}

var XPath = function(_document, expr) {
  this._document = _document;
  this.expr = expr;
}
XPath.prototype = new utils.Copy(ElemBase.prototype);
XPath.prototype.getNode = function (window) {
  // Adam please fill with code
}

var Name = function(_document, nName) {
  this._document = _document;
  this.nName = nName;
}
Name.prototype = new utils.Copy(ElemBase.prototype);
Name.prototype.getNode = function (window) {
  // Adam please fill with code
}



// 
// var Element = function(){
//   //base vars
//   this.win = null;
//   this.domNode = null;
//   //keep track of the locators we cant get via the domNode
//   this.locateOrder = ['id','name','link','xpath'];
//   this.locate = {};
// };
// 
// //element constructor
// Element.prototype.Element = function(node){
//   if (node){ this.domNode = node;}
//   if (node.id){ locate.id = node.id;}
//   if (node.name){ locate.name = node.name;}
//   return this;
// };
// 
// //getters
// Element.prototype.getNode = function(windowObj){
//   //set the lookup scope
//   this.win = windowObj;
// 
//   //if we already have a handle on the node
//   if (this.domNode){ return; }
//   
//   //check for a locator to use in order
//   for (loc in this.locateOrder){
//     //Or we dont have a value for this locator
//     if (!this.locate[loc]){return; }
//     
//     var str = 'this[nodeBy'+loc.toUpperCase()+'];';
//     var func = eval(str);
//     this.domNode = this.nodeSearch(func, this.locate[loc]);
//   }
//   //return this.returnOrThrow();
//   return this.domNode;
// };
// 
// Element.prototype.exists = function(){
//   if (this.domNode){ return true; }
//   else{ return false; }
// };
// //setters
// Element.prototype.ID = function(s){
//   this.locate.id = s;
//   return this;
// };
// Element.prototype.LINK = function(s){
//   this.locate.link = s;
//   return this;
// };
// Element.prototype.XPATH = function(s){
//   this.locate.xpath = s;
//   return this;
// };
// Element.prototype.NAME = function(s){
//    this.locate.name = s;
//    return this;
// };
// 
// //either returns the element, or throws an exception
// Element.prototype.returnOrThrow = function(){
//   if (!this.domNode){
//     var e = {};
//     e.message = "Element "+this.locate.toString()+" could not be found";
//     throw e;
//   }
//   else{
//     return this.domNode;
//   }
// }
// 
// //do the recursive search
// //takes the function for resolving nodes and the string
// Element.prototype.nodeSearch = function(func, s){
//   var e = null;
// 
//   //inline function to recursively find the element in the DOM, cross frame.
//   var recurse = function(w, func, s){
//    //do the lookup in the current window
//    element = func.call(w, s);   
//    if (!element){
//      var fc = w.frames.length;
//      var fa = w.frames;   
//      for (var i=0;i<fc;i++){ 
//        recurse(fa[i], func, s); 
//      }
//    }
//    else { e = element; }
//   };   
// 
//   recurse(win, func, s);
//   return e;
// }
// 
// //Lookup by ID
// Element.prototype.nodeByID = function (s){
//   return document.getElementById(s);
// }
// 
// //DOM element lookup functions, private to elementslib
// Element.prototype.nodeByNAME = function (s) { //search nodes by name
//   //sometimes the win object won't have this object
//   try{
//     var els = document.getElementsByName(s);
//     if (els.length > 0) {
//       return els[0];
//     }
//   }
//   catch(err){};
//   return null;
// };
// 
// //Lookup by link
// Element.prototype.nodeByLINK = function (s) {//search nodes by link text
//   var getText = function(el){
//     var text = "";
//     if (el.nodeType == 3){ //textNode
//       if (el.data != undefined){
//         text = el.data;
//       }
//       else{ text = el.innerHTML; }
//       text = text.replace(/\n|\r|\t/g, " ");
//     }
//     if (el.nodeType == 1){ //elementNode
//         for (var i = 0; i < el.childNodes.length; i++) {
//             var child = el.childNodes.item(i);
//             text += getText(child);
//         }
//         if (el.tagName == "P" || el.tagName == "BR" || 
//           el.tagName == "HR" || el.tagName == "DIV") {
//           text += "\n";
//         }
//     }
//     return text;
//   }
//   //sometimes the windows won't have this function
//   try {
//     var links = document.getElementsByTagName('a');
//   }
//   catch(err){}
//   for (var i = 0; i < links.length; i++) {
//     var el = links[i];
//     if (getText(el).indexOf(s) != -1) {
//       return el;
//     }
//   }
//   return null;
// };
// 
// //Lookup with xpath
// Element.prototype.nodeByXPATH = function (xpath) {
//   var nsResolver = function (prefix) {
//     if (prefix == 'html' || prefix == 'xhtml' || prefix == 'x') {
//       return 'http://www.w3.org/1999/xhtml';
//     } else if (prefix == 'mathml') {
//       return 'http://www.w3.org/1998/Math/MathML';
//     } else {
//       throw new Error("Unknown namespace: " + prefix + ".");
//     }
//   }
//   return document.evaluate(xpath, document, nsResolver, 0, null).iterateNext();
// };
//   