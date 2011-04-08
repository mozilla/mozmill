var setupModule = function(module) {
  module.controller = mozmill.getBrowserController();
};

var testMozElement = function(){
  controller.open('http://www.mozilla.org');
  controller.waitForPageLoad();

  var textbox = findElement.Elem(controller.tabs.activeTab.getElementById("q"));
  var button = findElement.ID(undefined, "quick-search-btn");
  
  textbox.sendKeys("tanowiących");
  
  var val1 = textbox.value;
  assert.equal(val1, "tanowiących", "Make sure we don't screw up utf-8 again");
  
};
  
