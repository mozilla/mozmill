Components.utils.import('resource://mozmill/modules/jum.js');

var setupModule = function(module) {
  module.controller = mozmill.getBrowserController();
};

var test_that_fails = function() {
  assertEquals(true, false, "This should fail");
};
