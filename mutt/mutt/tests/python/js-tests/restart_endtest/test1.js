Cu.import("resource://gre/modules/Services.jsm");

function testUserRestart() {
  var controller = mozmill.getBrowserController();
  controller.startUserShutdown(2000, true);
  controller.window.Application.restart();
}
