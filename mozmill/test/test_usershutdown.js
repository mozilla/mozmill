var setupModule = function(module) {
  module.controller = mozmill.getBrowserController();
}

/**
 * This test should pass
 */
var testRestartBeforeTimeout = function() {
  controller.startUserShutdown(4000, 2);
  controller.click(new elementslib.ID(controller.window.document, "file-menu"));
  controller.sleep(100);
  controller.click(new elementslib.ID(controller.window.document, "menu_fileQuitItem"));
  controller.window.alert("Should not see this");
}
