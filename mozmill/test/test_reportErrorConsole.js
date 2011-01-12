var setupModule = function() {
  controller = mozmill.getBrowserController();
}

var testErrorConsole = function() {
  controller.open("http://www.mozilla.org");
  controller.waitForPageLoad();

  Components.classes["@mozilla.org/filepicker;1"].createInstance(Components.interfaces.nsIFilePickr);
}
