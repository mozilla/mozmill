var setupModule = function(module) {
  controller = mozmill.getBrowserController();
}

var testWaitForPageLoad = function()  {
  controller.open("www.example.com");
  controller.waitForPageLoad();

  var domains = findElement.Link(controller.tabs.activeTab, "Domains");
  domains.click();
  controller.waitForPageLoad();

  controller.goBack();
  controller.waitForPageLoad();

  var domains = findElement.Link(controller.tabs.activeTab, "Domains");
  domains.click();
}
