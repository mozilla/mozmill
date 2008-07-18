var elementslib = {}; Components.utils.import('resource://mozmill/modules/elementslib.js', elementslib);
var mozmill = {}; Components.utils.import('resource://mozmill/modules/mozmill.js', mozmill);

controller = mozmill.getPreferencesController();

var test_clickTab = function() {
  e = new elementslib.Elem(
    controller.window.document.getAnonymousElementByAttribute(controller.window.document.documentElement, 'anonid', 'selector').childNodes[3] )
  controller.click(e);
}