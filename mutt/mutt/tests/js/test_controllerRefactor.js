var setupModule = function(module) {
  module.controller = mozmill.getBrowserController();
};

var testMozElement = function(){
  controller.open('http://www.mozilla.org');
  controller.waitForPageLoad();
  
  // This causes a failure - see bug 644249
  //var about = getElementBy.Link(undefined, "About Us"); 
  //about.click();
  //controller.waitForPageLoad();

  var textbox = findElement.Elem(controller.tabs.activeTab.getElementById("q"));
  var button = findElement.ID(undefined, "quick-search-btn");
  
  textbox.sendKeys("mozmill");
  controller.click(button);
  controller.waitForPageLoad();
  
  var logo = findElement.ID(undefined, "cse-logo");
  logo.click();
  controller.waitForPageLoad();

  const NAV_BAR = '/id("main-window")/id("tab-view-deck")/{"flex":"1"}' +
                                 '/id("navigator-toolbox")/id("nav-bar")';
  const URL_BAR = NAV_BAR + '/id("urlbar-container")/id("urlbar")';
  var urlBar = new elementslib.Lookup(controller.window.document, URL_BAR);
  
  urlBar.keypress("a", {accelKey:true});
  urlBar.sendKeys("http://www.google.com");
  urlBar.keypress("VK_RETURN", {});
  controller.waitForPageLoad();
};
