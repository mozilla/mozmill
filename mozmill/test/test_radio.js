var setupModule = function(module) {
  module.controller = mozmill.getBrowserController();
}

var testHTMLRadio = function() {
  controller.open('http://www.google.com/cse?cx=002443141534113389537%3Aysdmevkkknw&cof=FORID%3A0&q=mozmill&x=0&y=0');
  controller.waitForPageLoad();
  
  var radio = findElement.ID(controller.tabs.activeTab, "www");
  radio.select();
}

var testXULRadio = function() {
  prefs = mozmill.getPreferencesController();
  controller.sleep(1000);  // Wait for prefs dialog to open

  var radiogroup = findElement.ID(prefs.window.document, "saveWhere");
  radiogroup.select(1);
  radiogroup.select(0);  
}
