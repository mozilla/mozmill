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

var EXPORTED_SYMBOLS = ["Elem", "ID", "Link", "XPath", "Name", "Anon", "AnonXPath"];

var utils = {}; Components.utils.import('resource://mozmill/modules/utils.js', utils);
var results = {}; Components.utils.import('resource://mozmill/modules/results.js', results);
var strings = {}; Components.utils.import('resource://mozmill/stdlib/strings.js', strings);
var arrays = {}; Components.utils.import('resource://mozmill/stdlib/arrays.js', arrays);

var ElemBase = function(){
  this.isElement = true;
}
ElemBase.prototype.exists = function() {
  if (this.getNode()){ return true; }
  else{ return false; }
}

var Elem = function(node) {
  this.node = node;
  return this;
}
Elem.prototype = new utils.Copy(ElemBase.prototype);
Elem.prototype.getNode = function () { return this.node; }

var ID = function(_document, nodeID) {
  this._document = _document;
  this.nodeID = nodeID;
  return this;
}
ID.prototype = new utils.Copy(ElemBase.prototype);
ID.prototype.getInfo = function () {
  return "ID: " + this.nodeID;
}
ID.prototype.getNode = function () {
  return this._document.getElementById(this.nodeID);
}

var Link = function(_document, linkName) {
  this._document = _document;
  this.linkName = linkName;
  return this;
}
Link.prototype = new utils.Copy(ElemBase.prototype);
Link.prototype.getInfo = function () {
  return "Link: " + this.linkName;
}
Link.prototype.getNode = function () {
  var getText = function(el){
    var text = "";
    if (el.nodeType == 3){ //textNode
      if (el.data != undefined){
        text = el.data;
      }
      else{ text = el.innerHTML; }
      text = text.replace(/n|r|t/g, " ");
    }
    if (el.nodeType == 1){ //elementNode
        for (var i = 0; i < el.childNodes.length; i++) {
            var child = el.childNodes.item(i);
            text += getText(child);
        }
        if (el.tagName == "P" || el.tagName == "BR" || 
          el.tagName == "HR" || el.tagName == "DIV") {
          text += "n";
        }
    }
    return text;
  }
  //sometimes the windows won't have this function
  try { var links = this._document.getElementsByTagName('a'); }
  catch(err){ results.write('Error: '+ err, 'lightred'); }
  for (var i = 0; i < links.length; i++) {
    var el = links[i];
    //if (getText(el).indexOf(this.linkName) != -1) {
    if (el.innerHTML.indexOf(this.linkName) != -1){
      return el;
    }
  }
  return null;
}

var XPath = function(_document, expr) {
  this._document = _document;
  this.expr = expr;
  return this;
}
XPath.prototype = new utils.Copy(ElemBase.prototype);
XPath.prototype.getInfo = function () {
  return "XPath: " + this.expr;
}
XPath.prototype.getNode = function () {
  var nsResolver = function (prefix) {
    if (prefix == 'html' || prefix == 'xhtml' || prefix == 'x') {
      return 'http://www.w3.org/1999/xhtml';
    } else if (prefix == 'mathml') {
      return 'http://www.w3.org/1998/Math/MathML';
    } else {
      throw new Error("Unknown namespace: " + prefix + ".");
    }
  }
  var node = null;
  try {
    node = this._document.evaluate(this.expr, this._document, nsResolver, 0, null).iterateNext();  
  }
  catch(err){ node = null; }
  return node;
}

var Name = function(_document, nName) {
  this._document = _document;
  this.nName = nName;
  return this;
}
Name.prototype = new utils.Copy(ElemBase.prototype);
Name.prototype.getInfo = function () {
  return "Name: " + this.nName;
}
Name.prototype.getNode = function () {
  try{
    var els = this._document.getElementsByName(this.nName);
    if (els.length > 0) { return els[0]; }
  }
  catch(err){};
  return null;
}

var Anon = function(_document, lookupMethod, searchValue, accessor) {
  this._document = _document;
  this.lookupMethod = lookupMethod;
  this.searchValue = searchValue;
  this.accessor = accessor;
  
  return this;
}
Anon.prototype = new utils.Copy(ElemBase.prototype);
Anon.prototype.getInfo = function () {
  return "Anon: " + this.lookupMethod + ': '+this.searchValue+ ' '+ this.DOMOp;
}
Anon.prototype.getNode = function () {
   var func = this._document.defaultView.eval(this.lookupMethod);
   var n = new func(this._document, this.searchValue);
   var domNode = n.getNode()
   var collection = this._document.getAnonymousNodes(domNode);

   try {
     //If we received an index
     if (typeof(this.accessor) == "number"){
       return collection[this.accessor];
     }
     //else
     else if (typeof(this.accessor) == "string"){
       this._document.getAnonymousElementByAttribute(domNode, 'anonid', accessor);
     }
     else {
       this._document.getAnonymousElementByAttribute(domNode, this.accessor.property, this.accessor.value);
     } 
   }
   catch(err){
     return null;  
   }
   
   //if nothing matched the accessor, return null
   return null;
}
var AnonXPath = function(_document, XPath) {
  this._document = _document;
  this.XPath = XPath;
  
  return this;
}
AnonXPath.prototype = new utils.Copy(ElemBase.prototype);
AnonXPath.prototype.getInfo = function () {
  return "AnonXPath: " + this.XPath;
}

//iterate through array using document.evaluate to get to anony nodes
 //use getAnonymousElementByAttribute to get the anony node
 //use that node passed to document.evaluate to get to the next anony node
 //and the loop continues
 // ex this._document.getAnonymousElementByAttribute(domNode, this.accessor.property, this.accessor.value);
AnonXPath.prototype.getNode = function () {
  var returnNode = null;
  
  //Break up the XPath string by {}'s
  var xpathsArr = this.XPath.split(/{[^}]*}/g);
  var anonsArr = this.XPath.match(/{[^}]*}/g);
  
  //if they used like id() and there was an empty xpath entry rm it
  for (k in xpathsArr){
    if (xpathsArr[k] == ""){ 
        xpathsArr.pop();
    }
  }
  
  //the context for looking up the xpath
  var lookupParent = this._document;
  //for each piece of xpath
  for (i in xpathsArr){
    if (xpathsArr[i].charAt(xpathsArr[i].length-1) == "/"){
      xpathsArr[i] = xpathsArr[i].substr(0, xpathsArr[i].length-1)
    }
    var xpNode = this._document.evaluate(xpathsArr[i], lookupParent, null, this._document.defaultView.XPathResult.ANY_TYPE, null).iterateNext();
    if (xpNode == null){ return null; }
    
    //if there is an anon node in the matching array position
    if (typeof(anonsArr[i]) == "string"){
     var anonObj = null;
     this._document.defaultView.eval('anonObj = '+anonsArr[i]+';');
     //get the property name
     var propName = null;
     var propValue = null;
     
     for (j in anonObj){
       propName = j;
       propValue = anonObj[j];
       break;
     }
     //look up the node
     var anonNode = this._document.getAnonymousElementByAttribute(xpNode, propName, propValue);
     if (anonNode == null){ return null; }
     else{ lookupParent = anonNode; }
     
     //if this is the last anony node, were at the destination node
     if (i == anonsArr.length-1){
       returnNode = anonNode;
       break;
     }
    }
  }  
  return returnNode; 
}

function Lookup (_document, expression) {
  this._document = _document;
  this.expression = expression;
}
Lookup.prototype = new utils.Copy(ElemBase.prototype);
var _returnResult = function (results) {
  if (results.length == 0) {
    // TODO Throw exception, did not return any elements
  } else if (results.length == 1) {
    return results[0];
  } else {
    return results;
  }
}
var _forChildren = function (element, name, value) {
  var results = [];
  for (i in element.childNodes) {
    var n = element.childNodes[i];
    if (n[name] == value) {
      results.push(n);
    }
  }
  return results;
}
var _forAnonChildren = function (_document, element, name, value) {
  var results = [];
  var nodes = _document.getAnoymousNodes(element);
  for (i in nodes ) {
    var n = nodes[i];
    if (n[name] == value) {
      results.push(n);
    }
  }
  return results;
}
var _byID = function (_document, parent, value) {
  return _returnResult(_forChildren(parent, 'id', value));
}
var _byName = function (_document, parent, value) {
  return _returnResult(_forChildren(parent, 'tagName', value));
}
var _byAttrib = function (parent, value) {
  var results = [];
  for (i in parent.childNodes) {
    var n = parent.childNodes[i];
    requirementPass = 0;
    requirementLength = 0;
    for (a in value) {
      requirementLength++;
      if (n.getAttribute(a) == value[a]) {
        requirementPass++;
      }
    }
    if (requirementPass == requirementLength) {
      results.push(n);
    }
  }
  return results
}
var _byAnonAttrib = function (_document, parent, value) {
  var results = [];
  var nodes = _document.getAnonymousNodes(parent);
  for (i in nodes) {
    var n = nodes[i];
    requirementPass = 0;
    requirementLength = 0;
    for (a in value) {
      requirementLength++;
      if (n.getAttribute(a) == value[a]) {
        requirementPass++;
      }
    }
    if (requirementPass == requirementLength) {
      results.push(n);
    }
  }
  return results
}
var _byIndex = function (_document, parent, i) {
  return parent.childNodes[i];
}
var _anonByName = function (_document, parent, value) {
  return _returnResult(_forAnonChildren(_document, parent, 'tagName', value));
}
var _anonByAttrib = function (_document, parent, value) {
  return _returnResult(_forAnonAttrib(_document, parent, value))
}
var _anonByIndex = function (_document, parent, i) {
  return _document.getAnonymousNodes(parent)[i];
} 
Lookup.prototype.getNode = function () {
  var expSplit = this.expression.split('/');
  expSplit.unshift(this._document.documentElement)
  _document = this._document;
  var nCases = {'id':_byID, 'name':_byName, 'attrib':_byAttrib, 'index':_byIndex};
  var aCases = {'name':_anonByName, 'attrib':_anonByAttrib, 'index':_byAnonIndex};
  function reduceLookup (parent, exp) {
    // Handle case where only index is provided
    var cases = nCases;
    // Handle ending index before any of the expression gets mangled
    if (strings.endsWith(']')) {
      var expIndex = strings.vslice(exp, '[', ']');
    }
    // Handle anon
    if (!strings.startsWith(exp, 'anon')) {
      var exp = strings.vslice(exp, '(', ')');
      var cases = aCases;
    }
    if (strings.startsWith(exp, '[')) {
      return cases['index'](_document, parent, strings.vslice(exp, '[', ']'));
    }
    
    for (c in cases) {
      if (strings.startsWith(exp, c)) {
        var result = cases[c](_document, parent, strings.vslice(exp, '(', ')'));
      }
    }
    if (!result) {
      // TODO Throw exception
    }
    
    // Final return
    if (expIndex) {
      // TODO: Check length and raise error
      return result[expIndex];
    } else {
      // TODO: Check length and raise error
      return result;
    }
  }

  return expSplit.reduce(reduceLookup);
}
