var setupModule = function(module) {
  module.controller = mozmill.getBrowserController();
}

/**
 * This test should pass
 */
var testShutdownBeforeTimeout = function() {
  controller.startUserShutdown(4000, false);
  controller.click(new elementslib.ID(controller.window.document, "file-menu"));
  controller.sleep(1000);
  controller.click(new elementslib.ID(controller.window.document, "menu_fileQuitItem"));
}
