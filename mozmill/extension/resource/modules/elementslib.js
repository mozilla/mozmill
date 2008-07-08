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
    domNode = nodeSearch(nodeById, s);
    return returnOrThrow(s);
  };
  this.Element.LINK = function(s){
    domNode = nodeSearch(nodeByLink, s);
    return returnOrThrow(s);
  };
  this.Element.XPATH = function(s){
    xpath = s;
    domNode = nodeSearch(nodeByXPath, s);
    //do the lookup, then set the domNode to the result
    return returnOrThrow(s);
  };
  this.Element.XPATH.isValid = function(){
    //analyize the xpath expression
    //return bool
  };
  this.Element.NAME = function(s){
     domNode = nodeSearch(nodeByName, s);
     return returnOrThrow(s);
  };
  
  //either returns the element, or throws an exception
  var returnOrThrow = function(s){
    if (!domNode){
      var e = {};
      e.message = "Element "+s+" could not be found";
      throw e;
    }
    else{
      return domNode;
    }
  }
  
  //do the recursive search
  //takes the function for resolving nodes and the string
  var nodeSearch = function(func, s){
    var e = null;

    //inline function to recursively find the element in the DOM, cross frame.
    var recurse = function(w, func, s){
     //do the lookup in the current window
     element = func.call(w, s);   
     if (!element){
       var fc = w.frames.length;
       var fa = w.frames;   
       for (var i=0;i<fc;i++){ 
         recurse(fa[i], func, s); 
       }
     }
     else { e = element; }
    };   

    recurse(win, func, s);
    return e;
  }
  
  //Lookup by ID
  var nodeById = function (s){
    return this.document.getElementById(s);
  }
  
  //DOM element lookup functions, private to elementslib
  var nodeByName = function (s) { //search nodes by name
    //sometimes the win object won't have this object
    try{
      var els = this.document.getElementsByName(s);
      if (els.length > 0) {
        return els[0];
      }
    }
    catch(err){};
    return null;
  };
  
  //Lookup by link
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
    //sometimes the windows won't have this function
    try {
      var links = this.document.getElementsByTagName('a');
    }
    catch(err){}
    for (var i = 0; i < links.length; i++) {
      var el = links[i];
      if (getText(el).indexOf(s) != -1) {
        return el;
      }
    }
    return null;
  };

  //Lookup with xpath
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
    return this.document.evaluate(xpath, document, nsResolver, 0, null).iterateNext();
  };
  
};