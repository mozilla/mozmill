var elementslib = {}; Components.utils.import('resource://mozmill/modules/elementslib.js', elementslib);
var mozmill = {}; Components.utils.import('resource://mozmill/modules/mozmill.js', mozmill);

controller = mozmill.getPreferencesController();

var test_clickTab = function() {
  e = new elementslib.Elem( controller.tabs.Applications.button )
  controller.click(e);
  // e = new elementslib.XPath( controller.window.document, "/prefwindow[@id='BrowserPreferences']/prefpane[@id='paneApplications']/seperator"  )
}