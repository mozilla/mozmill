var elementslib = {}; Components.utils.import('resource://mozmill/modules/elementslib.js', elementslib);
var mozmill = {}; Components.utils.import('resource://mozmill/modules/mozmill.js', mozmill);

controller = mozmill.getPreferencesController();

var test_clickTab = function() {
  controller.click(new elementslib.XPath(controller.window.document, "/prefwindow[@id='BrowserPreferences']/xul:radiogroup/radio[4]"));
}