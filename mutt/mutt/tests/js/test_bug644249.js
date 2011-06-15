var setupModule = function(module) {
  module.controller = mozmill.getBrowserController();
};

var testEventUtilsError = function() {
  controller.open("http://www.mozilla.org");
  controller.waitForPageLoad();
  
  var about = new elementslib.Link(controller.tabs.activeTab, "About Us");
  controller.click(about);
  controller.waitForPageLoad();

  var textbox = new elementslib.Elem(controller.tabs.activeTab.getElementById("q"));
  var button = new elementslib.ID(controller.tabs.activeTab, "quick-search-btn");
  
  dump("Textbox ID: " + textbox.getNode().id + "\n");
  controller.type(textbox, "mozmill");
  dump("This is not reached (maybe?)\n");
  controller.click(button);
};
