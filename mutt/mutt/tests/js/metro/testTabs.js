function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();
}

function test() {
  controller.open('http://mozqa.com/data');
  controller.waitForPageLoad();

  controller.keypress(null, "t", { accelKey: true });
  controller.waitFor(function () {
    return controller.tabs.length == 2;
  }, "A second tab has been opened");

  expect.equal(controller.tabs.activeTabIndex, 1,
               "The second tab is selected");
  expect.equal(controller.tabs.getTab(1), controller.tabs.activeTab,
               "The second tab is the active tab");

  controller.open('http://mozqa.com/data/firefox');
  controller.waitForPageLoad();

  controller.tabs.selectTabIndex(0);

  expect.equal(controller.tabs.activeTabIndex, 0,
               "The first tab is selected");
  expect.equal(controller.tabs.getTab(0), controller.tabs.activeTab,
               "The first tab is the active tab");

  controller.keypress(null, "w", { accelKey: true });

  controller.waitFor(function () {
    return controller.tabs.length == 1;
  }, "The second tab has been closed");
}
