var elementslib = {}; Components.utils.import('resource://mozmill/modules/elementslib.js', elementslib);
var mozmill = {}; Components.utils.import('resource://mozmill/modules/mozmill.js', mozmill);

var setupModule = function() {
  module.browser = mozmill.getBrowserController();
}


var test_clicklink = function(){
  browser.click(new elementslib.Link(browser.activeTab, 'code'));
}