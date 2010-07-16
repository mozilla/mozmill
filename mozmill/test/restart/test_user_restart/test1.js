var setupModule = function(module) {
  module.controller = mozmill.getBrowserController();
}

/**
 * This test should pass
 */
var testRestartBeforeTimeout = function() {
  controller.startUserShutdown(2000, 3);
  controller.sleep(1000);
  controller.window.Application.restart();
  controller.window.alert("Should not see this");
}
