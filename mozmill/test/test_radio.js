var setupModule = function(module) {
  module.controller = mozmill.getBrowserController();
}

var testHTMLRadio = function() {
  controller.open('http://www.google.com/cse?cx=002443141534113389537%3Aysdmevkkknw&cof=FORID%3A0&q=mozmill&x=0&y=0');
  controller.waitForPageLoad();
  
  var radio = new elementslib.ID(controller.tabs.activeTab, "www");
  controller.radio(radio);
}

var testXULRadio = function() {
  prefs = mozmill.getPreferencesController();
  controller.sleep(1000);  // Wait for prefs dialog to open

  var radio = new elementslib.ID(prefs.window.document, "alwaysAsk");
  controller.radio(radio);
  
  radio = new elementslib.ID(prefs.window.document, "saveTo");
  controller.radio(radio);
}
