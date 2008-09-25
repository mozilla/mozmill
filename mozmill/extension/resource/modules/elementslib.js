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

var EXPORTED_SYMBOLS = ["Elem", "ID", "Link", "XPath", "Name", "Anon", "AnonXPath",
                        "Lookup", "_byID", "_byName", "_byAttrib", "_byAnonAttrib",
                       ];

var utils = {}; Components.utils.import('resource://mozmill/modules/utils.js', utils);
var mresults = {}; Components.utils.import('resource://mozmill/modules/results.js', mresults);
var strings = {}; Components.utils.import('resource://mozmill/stdlib/strings.js', strings);
var arrays = {}; Components.utils.import('resource://mozmill/stdlib/arrays.js', arrays);
var json2 = {}; Components.utils.import('resource://mozmill/stdlib/json2.js', json2);
var withs = {}; Components.utils.import('resource://mozmill/stdlib/withs.js', withs);
var dom = {}; Components.utils.import('resource://mozmill/stdlib/dom.js', dom);
var objects = {}; Components.utils.import('resource://mozmill/stdlib/objects.js', objects);

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
  catch(err){ mresults.write('Error: '+ err, 'lightred'); }
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
// XPath.prototype.getNode = function () {
//   var nsResolver = function (prefix) {
//     if (prefix == 'html' || prefix == 'xhtml' || prefix == 'x') {
//       return 'http://www.w3.org/1999/xhtml';
//     } else if (prefix == 'mathml') {
//       return 'http://www.w3.org/1998/Math/MathML';
//     } else {
//       throw new Error("Unknown namespace: " + prefix + ".");
//     }
//   }
//   var node = null;
//   try {
//     node = this._document.evaluate(this.expr, this._document, nsResolver, 0, null).iterateNext();  
//   }
//   catch(err){ node = null; }
//   return node;
// }
XPath.prototype.getNode = function () {
  var aNode = this._document;
  var aExpr = this.expr;

  var xpe = new this._document.defaultView.XPathEvaluator();
  var nsResolver = xpe.createNSResolver(aNode.ownerDocument == null ?
    aNode.documentElement : aNode.ownerDocument.documentElement);
  var result = xpe.evaluate(aExpr, aNode, nsResolver, 0, null);
  var found = [];
  var res;
  while (res = result.iterateNext())
    found.push(res);
  return found[0];
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

function Lookup (_document, expression) {
  this._document = _document;
  this.expression = expression;
}
Lookup.prototype = new utils.Copy(ElemBase.prototype);
var _returnResult = function (results) {
  if (results.length == 0) {
    return null
  } else if (results.length == 1) {
    return results[0];
  } else {
    return results;
  }
}
var _forChildren = function (element, name, value) {
  var results = [];
  var nodes = [e for each (e in element.childNodes) if (e)]
  for (i in nodes) {
    var n = nodes[i];
    if (n[name] == value) {
      results.push(n);
    }
  }
  return results;
}
var _forAnonChildren = function (_document, element, name, value) {
  var results = [];
  var nodes = [e for each (e in _document.getAnoymousNodes(element)) if (e)];
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
var _byAttrib = function (parent, attributes) {
  var results = [];

  var nodes = parent.childNodes;
  for (i in nodes) {
    var n = nodes[i];
    // mresults.write(n.getAttribute('label')+' || '+(n.getAttribute('label') == attributes.label))
    requirementPass = 0;
    requirementLength = 0;
    for (a in attributes) {
      requirementLength++;
      try {
        if (n.getAttribute(a) == attributes[a]) {
          requirementPass++;
        }
      } catch (err) {
        // Workaround any bugs in custom attribute crap in XUL elements
      }
    }
    if (requirementPass == requirementLength) {
      results.push(n);
    }
  }
  if (results.length == 0) {
    // mresults.write(json2.JSON.stringify(attributes));
  }
  return _returnResult(results)
}
var _byAnonAttrib = function (_document, parent, attributes) {
  var results = [];
  
  if (objects.getLength(attributes) == 1) {
    for (i in attributes) {var k = i; var v = attributes[i]; }
    var result = _document.getAnonymousElementByAttribute(parent, k, v)
    if (result) {
      return result;
      
    } 
  }
  var nodes = [n for each (n in _document.getAnonymousNodes(parent)) if (n.getAttribute)];
  function resultsForNodes (nodes) {
    for (i in nodes) {
      var n = nodes[i];
      requirementPass = 0;
      requirementLength = 0;
      for (a in attributes) {
        requirementLength++;
        if (n.getAttribute(a) == attributes[a]) {
          requirementPass++;
        }
      }
      if (requirementPass == requirementLength) {
        results.push(n);
      }
    }
  }  
  resultsForNodes(nodes)  
  if (results.length == 0) {
    resultsForNodes([n for each (n in parent.childNodes) if (n.getAttribute)])
    if (results.length == 0) {
      // mresults.write('anon '+json2.JSON.stringify(attributes)+parent.childNodes.length);
      // mresults.write('anon '+json2.JSON.stringify(attributes)+_document.getAnonymousNodes(parent).length);
      // mresults.write('anon || '+json2.JSON.stringify(attributes));
    }
  }
  return _returnResult(results)
}
var _byIndex = function (_document, parent, i) {
  return parent.childNodes[i];
}
var _anonByName = function (_document, parent, value) {
  return _returnResult(_forAnonChildren(_document, parent, 'tagName', value));
}
var _anonByAttrib = function (_document, parent, value) {
  return _byAnonAttrib(_document, parent, value);
}
var _anonByIndex = function (_document, parent, i) {
  return _document.getAnonymousNodes(parent)[i];
} 
Lookup.prototype.getNode = function () {
  var expSplit = [e for each (e in this.expression.split('/') ) if (e != '')];
  expSplit.unshift(this._document)
  _document = this._document;
  var nCases = {'id':_byID, 'name':_byName, 'attrib':_byAttrib, 'index':_byIndex};
  var aCases = {'name':_anonByName, 'attrib':_anonByAttrib, 'index':_anonByIndex};
  var reduceLookup = function (parent, exp) {
    // Handle case where only index is provided
    var cases = nCases;
    
    // Handle ending index before any of the expression gets mangled
    if (withs.endsWith(exp, ']')) {
      var expIndex = json2.JSON.parse(strings.vslice(exp, '[', ']'));
    }
    // Handle anon
    if (withs.startsWith(exp, 'anon')) {
      var exp = strings.vslice(exp, '(', ')');
      var cases = aCases;
    }
    if (withs.startsWith(exp, '[')) {
      var r = cases['index'](_document, parent, json2.JSON.parse(strings.vslice(exp, '[', ']')));
      if (r == null) {
        throw 'Expression "'+exp+'" returned null. Anonymous == '+(cases == aCases) 
      }
      return r;
    }
    
    for (c in cases) {
      if (withs.startsWith(exp, c)) {
        var result = cases[c](_document, parent, json2.JSON.parse(strings.vslice(exp, '(', ')')));
      }
    }
    
    if (!result) {
      if ( withs.startsWith(exp, '{') ) {
        if (cases == aCases) {
          var result = _anonByAttrib(_document, parent, json2.JSON.parse(exp))
        } else {
          var result = _byAttrib(parent, json2.JSON.parse(exp))
        }
      }
      if (!result) {
        throw 'Expression "'+exp+'" returned null. Anonymous == '+(cases == aCases)
      }
    }
    
    // Final return
    if (expIndex) {
      // TODO: Check length and raise error
      return result[expIndex];
    } else {
      // TODO: Check length and raise error
      return result;
    }
    return 'broken'
  }
  return expSplit.reduce(reduceLookup);
}
