/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

const BASE_URL = collector.addHttpResource("../../data/");
const TEST_DATA = BASE_URL + "form.html";

const ELEMENTS = [
  DOM_Element = {
    url: BASE_URL + "link.html",
    id: "link"
  },
  XUL_Element = {
    url: "chrome://mozmill/content/test/chrome_elements.xul",
    id: "menulist"
  }
];

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();
  aModule.controller2 = null;
}

function teardownModule(aModule) {
 if (aModule.controller2 && !aModule.controller2.window.closed) {
    aModule.controller2.window.close();
  }
}

function test() {
  controller.open(TEST_DATA);
  controller.waitForPageLoad();

  let textbox = findElement.ID(controller.tabs.activeTab, "fname");
  let submit = findElement.ID(undefined, "submitButton");

  textbox.sendKeys("mozmill");
  submit.click();
  controller.waitForPageLoad();

  let urlbar = new findElement.ID(controller.window.document, "urlbar");
  let previousURL = urlbar.getNode().value;

  urlbar.keypress("a", {accelKey: true});
  urlbar.sendKeys(TEST_DATA);
  urlbar.keypress("VK_RETURN", {});
  controller.waitForPageLoad();

  expect.equal(urlbar.getNode().value, previousURL,
               "Loaded URL has to be equal to the initially loaded one.");
};


function testMozElementElem() {
  ELEMENTS.forEach(function (aElement) {
    controller.open(aElement["url"]);
    controller.waitForPageLoad();

    var node = controller.tabs.activeTab.getElementById(aElement["id"]);
    var element = new findElement.Elem(node);

    assert.ok(element.exists(), "Element with id: " + aElement["id"] +
                                " has been found");
    assert.ok(element.getNode().isEqualNode(node), "Element node equals node");

    node.parentNode.removeChild(node);

    assert.ok(!element.exists(), "Element with id: " + aElement["id"] +
                                 " has not been found");

    controller.refresh();
    controller.waitForPageLoad();

    // After a refresh the element is not the same
    assert.ok(!element.exists(), "Element with id: " + aElement["id"] +
                                 " has not been found");
  });
}

function testContentDocumentAndWindow() {
  // Open a new tab
  controller.mainMenu.click("#menu_newNavigatorTab");
  controller.waitForPageLoad();

  let document = new findElement.MozMillElement("Elem", controller.tabs.activeTab);
  let window = new findElement.MozMillElement("Elem", controller.tabs.activeTab.defaultView);

  assert.ok(window.exists(), "Content window has been found");
  assert.ok(document.exists(), "Content document has been found");

  try {
    // Add event listener to wait until the tab has been closed
    let self = { closed: false };
    function checkTabClosed() { self.closed = true; }
    controller.window.addEventListener("TabClose", checkTabClosed);

    // Close the tab
    window.getNode().close();

    mozmill.utils.waitFor(function () {
      return self.closed;
    });
  } finally {
    controller.window.removeEventListener("TabClose", checkTabClosed);
  }

  assert.ok(!window.exists(), "Content window has not been found");
  assert.ok(!document.exists(), "Content document has not been found");
}

function testChromeDocumentAndWindow() {
  let initialWindowsCount = mozmill.utils.getWindows("navigator:browser").length;

  // Open a new window
  controller.mainMenu.click("#menu_newNavigator");

  assert.waitFor(() => {
    let windows = mozmill.utils.getWindows("navigator:browser");

    return windows.length === (initialWindowsCount + 1);
  }, "A new window has been opened");

  // Get the controller of the new opened window
  controller2 = mozmill.getBrowserController();

  let window = new findElement.MozMillElement("Elem", controller2.window);
  let document = new findElement.MozMillElement("Elem",
                                                controller2.window.document);

  assert.ok(window.exists(), "Chrome window has been found");
  assert.ok(document.exists(), "Chrome document has been found");

  // Close the window
  window.getNode().close();
  assert.waitFor(() => {
    let windows = mozmill.utils.getWindows("navigator:browser");

    return windows.length === initialWindowsCount;
  }, "Window has been closed");

  assert.ok(!document.exists(), "Chrome document element has been found");
  assert.ok(!window.exists(), "Chrome window element has been found");
}
