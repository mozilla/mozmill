var elementslib = {}; Components.utils.import('resource://mozmill/modules/elementslib.js', elementslib);
var controller = {}; Components.utils.import('resource://mozmill/modules/controller.js', controller);

var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
                   .getService(Components.interfaces.nsIWindowMediator);
var _w = wm.getMostRecentWindow("mail:3pane");
var messenger = new controller.MozMillController(_w);

var test_foo = function(){
 messenger.type(new elementslib.ID(_w.document, 'searchInput'), "test");
 messenger.sleep(5000);
}
