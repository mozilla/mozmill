var setupModule = function () {
  controller = mozmill.getBrowserController();

  controller.startUserShutdown(1000, true);
  controller.window.Application.restart();
}
