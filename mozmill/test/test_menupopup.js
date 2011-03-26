var setupModule = function(module) {
  module.controller = mozmill.getBrowserController();
};

var testAddonMenuPopup = function() {
  var addons = mozmill.getAddonsController();
  controller.waitForPageLoad();

  var button = new elementslib.ID(controller.tabs.activeTab, "header-utils-btn");
  controller.select(button, 1);
  controller.select(button, 3);
  controller.select(button, undefined, "Update Add-ons Automatically");
};

var testLongMenuPopup = function() {
  var prefs = mozmill.getPreferencesController();
  controller.sleep(2000);  // Wait for prefs dialog to appear

  var pane = new elementslib.ID(prefs.window.document, "paneContent");

  controller.keypress(pane, "VK_RIGHT", {});
  controller.sleep(1000);  // If keypresses sent too quickly triggers known bug in Firefox where content pane doesn't load
  controller.keypress(pane, "VK_RIGHT", {});
  controller.sleep(1000);  // Wait for the content pane to load

  var droplist = new elementslib.ID(prefs.window.document, "defaultFont");

  controller.select(droplist, 0);
  controller.select(droplist, undefined, "sans-serif");
  controller.select(droplist, undefined, undefined, "ori1Uni");
  controller.select(droplist, 0);
};
