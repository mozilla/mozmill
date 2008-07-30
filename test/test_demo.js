var elementslib = {}; Components.utils.import('resource://mozmill/modules/elementslib.js', elementslib);
var mozmill = {}; Components.utils.import('resource://mozmill/modules/mozmill.js', mozmill);

var test_PrefsContentTab = function() {
  // Bring up preferences controller.
  var controller = mozmill.getPreferencesController();
  // click on the Content prefs tab
  controller.click(new elementslib.Elem( controller.tabs.Content.button ));
  // sleep for a second
  e = new elementslib.ID(controller.window.document, 'popupPolicy')
  controller.waitForElement(e);
  // disable "Block popups"
  controller.click(e);
  // disable "Load Images"
  controller.click(new elementslib.ID(controller.window.document, 'loadImages'));
  // disable JavaScript
  controller.click(new elementslib.ID(controller.window.document, 'enableJavaScript'));
  // disable Java
  controller.click(new elementslib.ID(controller.window.document, 'enableJava'));
}

var test_GoogleDotCom = function () {
  // Bring up browser controller.
  var controller = mozmill.getBrowserController();
  controller.open('http://www.google.com');
  controller.sleep(2000);
  controller.type(new elementslib.Name(controller.window.content.document, 'q'), 'Mozilla');
  controller.click(new elementslib.Name(controller.window.content.document, 'btnG')); 
}