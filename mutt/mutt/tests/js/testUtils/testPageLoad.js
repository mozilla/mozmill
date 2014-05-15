/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

const TEST_DATA = [
  // Normal pages
  {url: baseurl + "form.html", type: "ID", value: "fname"},
  {url: baseurl + "link.html", type: "ID", value: "link"},
  {url: baseurl + "singlediv.html", type: "ID", value: "test-div"},

  // FTP pages
  {url: "ftp://ftp.mozilla.org/pub/", type: "Link", value: "firefox" },

  // Error pages
  {url: "https://ssl-unknownissuer.mozqa.com", type: "ID", value: "cert_domain_link"},
  {url: "http://www.mozilla.org/firefox/its-a-trap.html", type: "ID", value: "ignoreWarningButton"},
  {url: "http://www.mozilla.org/firefox/its-a-trap.html", type: "ID", value: "getMeOutButton"},

  // Container page
  {url: baseurl + "iframe.html", type: "ID", value: "iframe"}
];

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();
}

function testWaitForPageLoad() {
  let win = new elementslib.MozMillElement("Elem", controller.window);

  /**
   * PART I - Check different types of pages
   */
  // We specify test data pages above to check, omit Container page [7]
  for (var n in [0, 1, 2, 3, 4, 5, 6]) {
    controller.open(TEST_DATA[n].url);
    controller.waitForPageLoad();

    // Check that the expected element exists
    var elem = new elementslib.MozMillElement(TEST_DATA[n].type, TEST_DATA[n].value,
                                              {document: controller.tabs.activeTab});
    expect.ok(elem.exists(), "Element '" + TEST_DATA[n].value + "' has been found.");
  }

  /**
   * PART II - Test different parameter sets
   */
  var location = TEST_DATA[0];
  for (var i = 0; i < 7; i++) {
    controller.open(location.url);

    switch (i) {
      case 0:
        controller.waitForPageLoad(controller.tabs.activeTab);
        break;
      case 1:
        controller.waitForPageLoad(controller.tabs.activeTab, undefined, 10);
        break;
      case 2:
        controller.waitForPageLoad(controller.tabs.activeTab, "invalid");
        break;
      case 3:
        controller.waitForPageLoad(undefined, null, 100);
        break;
      case 4:
        controller.waitForPageLoad(null, undefined, 100);
        break;
      case 5:
        controller.waitForPageLoad("invalid", undefined);
        break;
      case 6:
        controller.waitForPageLoad(undefined, "invalid");
        break;
    }
  }

  /**
   * PART III - Check that we correctly handle timeouts for waitForPageLoad
   */
  // Bug 974859:
  // controller.waitForPageLoad() doesn't timeout for 0
  // try {
  //   controller.open(TEST_DATA[0].url);
  //   controller.waitForPageLoad(0);

  //   throw new Error("controller.waitForPageLoad() not timed out for timeout=0.");
  // } catch (ex if ex isinstanceof errors.TimeoutError) {
  // }

  /**
   * PART IV - Make sure we don't fail when clicking links on a page
   */

  controller.open(TEST_DATA[1].url);
  controller.waitForPageLoad();

  var link = new elementslib.MozMillElement("Selector", "#link",
                                            {document: controller.tabs.activeTab});
  link.click();
  controller.waitForPageLoad();

  var target = new elementslib.MozMillElement("Selector", "#test-div",
                                           {document: controller.tabs.activeTab});
  target.waitForElement(1000);

  /**
   * PART V - Loading an iFrame
   */

  // Load the Container page
  controller.open(TEST_DATA[7].url);
  controller.waitForPageLoad();

  // Get trigger element and the controller for the iFrame
  var trigger = new elementslib.Selector(controller.tabs.activeTab, "#load");
  var frame = new elementslib.Selector(controller.tabs.activeTab, "#iframe");
  var frameWindow = frame.getNode().contentWindow;
  var frameController = new mozmill.controller.MozMillController(frameWindow);

  // Trigger the loading of the iframe from the main controller
  trigger.click();
  controller.waitForPageLoad(frameController.window.document);

  // Once the iframe has been loaded assert that the element exists
  var elem = new elementslib.MozMillElement("ID", "test-div", {document: frameWindow.document});
  expect.ok(elem.exists(), "Node in iFrame has been found");

  /**
   * PART VI - Loading a page in another tab should wait for its completion
   */
  var bkgndTabIndex = controller.tabs.activeTabIndex;
  controller.open(TEST_DATA[1].url);

  // Open a new tab now
  win.keypress("t", {accelKey: true});
  controller.open(TEST_DATA[0].url);

  // Wait for our old tab to load in the background
  controller.waitForPageLoad(controller.tabs.getTab(bkgndTabIndex));

  var element = new elementslib.MozMillElement(TEST_DATA[1].type, TEST_DATA[1].value,
                                               {document: controller.tabs.getTab(bkgndTabIndex)});
  expect.ok(element.exists(), "Element '" + TEST_DATA[1].value +
            "'in background tab has been found");

  win.keypress("w", {accelKey: true});

}
