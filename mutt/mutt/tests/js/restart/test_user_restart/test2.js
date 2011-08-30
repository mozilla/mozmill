var setupModule = function(module) {
  module.controller = mozmill.getBrowserController();
}

/**
 * This test should pass
 */
var testShutdownBeforeTimeout = function() {
    controller.startUserShutdown(10000, false);
    controller.mainMenu.click("#menu_FileQuitItem");
    controller.sleep(1000);
}
