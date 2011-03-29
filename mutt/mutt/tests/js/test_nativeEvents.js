var setupModule = function(module) {
  module.controller = mozmill.getBrowserController();
}

var testNativeEvents = function () {
  controller.open("http://localhost/test.html");
  controller.waitForPageLoad();

  var firefox = new elementslib.ID(controller.tabs.activeTab, "firefox");
  controller.click(firefox, undefined, undefined, undefined, true);
}
