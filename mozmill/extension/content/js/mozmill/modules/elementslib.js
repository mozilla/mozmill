var elementslib = new function(){
  //base vars
  var win = mozmill.testWindow;
  var domNode = null;
  //keep track of the locators we cant get via the domNode
  var xpath = '';
  var link = '';
  
  this.setWindow = function(windowObj){
    win = windowObj;
    return win;
  };
  
  //element constructor
  this.Element = function(node){
    if (node){ domNode = node;}
    if (node.id){ id = node.id;}
    if (node.name){ name = node.name;}
    return domNode;
  };
  //getters
  this.Element.exists = function(){
    if (domNode){ return true; }
    else{ return false; }
  };
  this.Element.getNode = function(){
    return domNode;
  };
  //setters
  this.Element.ID = function(s){
    domNode = win.document.getElementById(s);
    return domNode;
  };
  this.Element.LINK = function(s){
     domNode = nodeByLink(s);
     return domNode;
  };
  this.Element.XPATH = function(s){
    xpath = s;
    domNode = nodeByXPath(s);
    //do the lookup, then set the domNode to the result
    return domNode;
  };
  this.Element.XPATH.isValid = function(){
    //analyize the xpath expression
    //return bool
  };
  this.Element.NAME = function(s){
     domNode = nodeByName(s);
     return domNode;
  };
  
  //DOM element lookup functions, private to elementslib
  var nodeByName = function (s) { //search nodes by name
    var els = win.document.getElementsByName(s);
    if (els.length > 0) {
      return els[0];
    }
    return null;
  };
  
  var nodeByLink = function (s) {//search nodes by link text
    var getText = function(el){
      var text = "";
      if (el.nodeType == 3){ //textNode
        if (el.data != undefined){
          text = el.data;
        }
        else{ text = el.innerHTML; }
        text = text.replace(/\n|\r|\t/g, " ");
      }
      if (el.nodeType == 1){ //elementNode
          for (var i = 0; i < el.childNodes.length; i++) {
              var child = el.childNodes.item(i);
              text += getText(child);
          }
          if (el.tagName == "P" || el.tagName == "BR" || 
            el.tagName == "HR" || el.tagName == "DIV") {
            text += "\n";
          }
      }
      return text;
    }
    var links = win.document.getElementsByTagName('a');
    for (var i = 0; i < links.length; i++) {
      var el = links[i];
      if (getText(el).indexOf(s) != -1) {
        return el;
      }
    }
    return null;
  };


  var nodeByXPath = function (xpath) {
    var nsResolver = function (prefix) {
      if (prefix == 'html' || prefix == 'xhtml' || prefix == 'x') {
        return 'http://www.w3.org/1999/xhtml';
      } else if (prefix == 'mathml') {
        return 'http://www.w3.org/1998/Math/MathML';
      } else {
        throw new Error("Unknown namespace: " + prefix + ".");
      }
    }
    return win.document.evaluate(xpath, document, nsResolver, 0, null).iterateNext();
  };
  
};