var elementslib = {}; 
Components.utils.import('resource://mozmill/modules/elementslib.js', elementslib);
var mozmill = {}; 
Components.utils.import('resource://mozmill/modules/mozmill.js', mozmill);

var test_focus = function(){
 var controller = mozmill.getBrowserController();
 controller.open('http://www.yahoo.com');
 controller.waitForElement(new elementslib.ID(controller.window.content.document, 'q'), 5000);
 var searchBox = new elementslib.ID(controller.window.content.document, 'p');
 searchBox.getNode().focus();
 controller.sleep(2000);
 var urlbar = new elementslib.ID(controller.window.document, 'urlbar');
 urlbar.getNode().focus();
 var homeButton = new elementslib.ID(controller.window.document, 'home-button');
 homeButton.getNode().focus()
}