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

var testWaitForResult = function () {
  let onlyTheFirst = true;

  expect.doesNotThrow(function () {
    controller.waitFor(function () {
      let res = onlyTheFirst;
      onlyTheFirst = false;

      return res;
    }, undefined, 200, 0);
  }, "TimeoutError", "WaitFor has to pass if true is returned.");
}

var testWaitForCallbackCounter = function () {
  let counter = 2;
  
  expect.doesNotThrow(function () {
    controller.waitFor(function () {
      counter--;
      return counter > 0;
    }, 200, 0);
  }, "TimeoutError", "WaitFor shouldn't call callback after the first true result.");

  expect.equal(counter, 1, "WaitFor shouldn't call callback after the first true result. (Second check)");
}
