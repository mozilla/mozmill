var tabview = require("../../mozmill-tests/shared-modules/tabview");

var setupModule = function(module) {
  controller = mozmill.getBrowserController();
  tabView = new tabview.tabView(controller);
}

var testFoo = function() {
  tabView.open();

  // wait for tab candy to open
  controller.sleep(2000);

  var tv = controller.window.document.getElementById("tab-view");
  var doc = tv.contentDocument;
  var win = tv.contentWindow;

  var tab = new elementslib.Selector(doc, ".tab");
  var content = new elementslib.ID(doc, "content");
  controller.dragToElement(tab.getNode(), content.getNode(), 
    win, 500, 600);
  
  var looseTabs = new elementslib.Selector(doc, ".tabInGroupItem");
  controller.assertNode(looseTabs);
  // there should only be one tab in the group now
  controller.assertJS(function() { return !looseTabs.getNode(1); });
}
