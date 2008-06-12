var MozMill = {
  onLoad: function() {
    // initialization code
    this.initialized = true;
  },

  onMenuItemCommand: function() {
    var w = window.open("chrome://mozmill/content/mozmill.xul", "", "chrome,centerscreen,resizable,height=450,width=400");
  }
};

window.addEventListener("load", function(e) { MozMill.onLoad(e); }, false);

function mozMillTestWindow() {
  window.open("chrome://mozmill/content/testwindow.xul", "", "chrome, centerscreen, resizable");
}