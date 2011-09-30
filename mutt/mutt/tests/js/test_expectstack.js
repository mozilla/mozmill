/* This test is run from the use_mozmill test over in the python area
 * so it doesn't show up in the manifest :)
 */
var setupModule = function() {
  controller = mozmill.getBrowserController();
}

var testExpectStack = function() {

  controller.open("http://www.mozilla.org");

  // Check that an invalid element element exists
  var elem = new elementslib.MozMillElement("ID", "foobar_the_friendly",
                                            {document: controller.tabs.activeTab});
  expect.ok(elem.exists(), "Element foobar_the_friendly has been found.");
};

