// First test that ensures the js unit test side is functioning properly
Components.utils.import('resource://mozmill/modules/jum.js');

var setupModule = function(module) {
  controller = mozmill.getBrowserController();
}

var testSanity = function () {
  assertNotEquals(controller, null, "This should pass");
  
  // Something that will fail
  assertEquals(true, false, "This should fail");
};

