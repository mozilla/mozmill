var setupModule = function(module) {
  module.controller = mozmill.getBrowserController();
  controller.open('http://www.google.com/');
  controller.waitForPageLoad();
}

// screenshots of content window
var testContentScreenshot = function() {
  var logo = findElement.ID(controller.window.document, "hplogo");
  var searchForm = findElement.ID(controller.tabs.activeTab, "searchform");

  var mngb = findElement.ID(controller.tabs.activeTab, "mngb");
  var gb_1 = findElement.ID(controller.tabs.activeTab, "gb_1");
  var lga = findElement.ID(controller.tabs.activeTab, "lga");
  var about = findElement.Link(controller.tabs.activeTab, "About Google");

  controller.screenShot(controller.window, "screen1", true, [logo, searchForm]);
  controller.screenShot(mngb, "screen2", true, [gb_1]);
  controller.screenShot(lga, "screen3", true, [about]);
}

// screenshots of top chrome
var testChromeScreenshot = function() {
  var toolbox = findElement.ID(controller.window.document, "navigator-toolbox");
  var tabs = findElement.ID(controller.window.document, "tabbrowser-tabs");

  controller.screenShot(controller.window, "screen4", true, [tabs]);
  controller.screenShot(toolbox, "screen5", true, [tabs]);
}

// screenshots of sidebars
var testSidebarScreenshot = function () {
  var root = findElement.Elem(controller.window.getBrowser());
  root.keypress('b', {'ctrlKey':true});
  controller.sleep(1000); // Wait for bookmarks sidebar to open
  
  var logo = findElement.ID(controller.tabs.activeTab, "hplogo");
  var sidesearch = findElement.ID(controller.window.document, "sidebar-search-container");
  var searchbox = findElement.ID(controller.window.document, "search-box");

  controller.screenShot(controller.window, "screen6", true, [logo]);
  controller.screenShot(controller.window, "screen7", true, [sidesearch]);
  controller.screenShot(sidesearch, "screen8", true, [searchbox]);
}

// screenshots of popup dialogs
var testDialogScreenshot = function() {
  prefs = mozmill.getPreferencesController();
  controller.sleep(1000);  // Wait for prefs dialog to open

  var radio = findElement.ID(prefs.window.document, "saveTo");
  var startup = findElement.ID(prefs.window.document, "paneMain");
  var homepage = findElement.ID(prefs.window.document, "browserHomePage");
  
  controller.screenShot(prefs.window, "screen9", true, [radio]);
  controller.screenShot(startup, "screen10", true, [homepage]);
}
