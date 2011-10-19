var setupModule = function(module) {
  module.controller = mozmill.getBrowserController();
}

var testHTMLRadio = function() {
  let page = collector.addHttpResource('./files/') + "radio_button.html";
  controller.open(page);
  controller.waitForPageLoad();
  
  let radio1 = findElement.ID(controller.tabs.activeTab, "radio1");
  let radio2 = findElement.ID(controller.tabs.activeTab, "radio2");
  radio1.select();
  radio2.select();
}

var testXULRadio = function() {
  prefs = mozmill.getPreferencesController();
  controller.sleep(1000);  // Wait for prefs dialog to open

  var radiogroup = findElement.ID(prefs.window.document, "saveWhere");
  radiogroup.select(1);
  radiogroup.select(0);  
}
