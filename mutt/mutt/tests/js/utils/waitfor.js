var setupModule = function () {
  controller = mozmill.getBrowserController();
}

var testWaitForCallback = function () {
  expect.doesNotThrow(function () {
    controller.waitFor(function () {
      return true;
    });
  }, "TypeError", "Return type 'boolean' in callback is supported.");

  expect.throws(function () {
    controller.waitFor(function () {
      return 4;
    });
  }, "TypeError", "Return type 'number' in callback is not supported.");

  expect.throws(function () {
    controller.waitFor(function () {
      return "true";
    });
  }, "TypeError", "Return type 'string' in callback is not supported.");

  expect.throws(function () {
    controller.waitFor(function () {
      return new Object();
    });
  }, "TypeError", "Return type 'Object' in callback is not supported.");
}
