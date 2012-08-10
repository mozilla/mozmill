Cu.import("resource://gre/modules/Services.jsm");


function testRestart() {
  try {
    throw Error("A failure which is not caught.");
  } finally {
    var controller = mozmill.getBrowserController();
    controller.restartApplication('testShutdown');
  }
}

function testShutdown() {
  try {
    throw Error("A failure which is not caught.");
  } finally {
    var controller = mozmill.getBrowserController();
    controller.stopApplication();
  }
}
