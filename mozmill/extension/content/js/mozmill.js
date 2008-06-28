var $ = function(id) {
  return document.getElementById(id);
};

var mozmill = new function(){
  this.testWindow = opener;
  this.MozMillController = function(windowObj){
    this.win = windowObj;
    return this;
  }
};

opener.mozmill = mozmill;

