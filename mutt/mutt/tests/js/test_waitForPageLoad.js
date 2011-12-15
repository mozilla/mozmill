const LOCATIONS = [
  // Normal pages
  {url : "https://encrypted.google.com/", type: "ID", value : "hplogo"},
  {url : "https://addons.mozilla.org/en-US/firefox/?browse=featured", type: "ID", value : "search-q"},
  {url : "http://addons.mozilla.org", type: "ID", value : "search-q"},

  // FTP pages
  {url : "ftp://ftp.mozilla.org/pub/", type : "Link", value : "firefox" },

  // Error pages
  {url : "https://mur.at", type: "ID", value : "cert_domain_link"},
  {url : "http://www.mozilla.com/firefox/its-a-trap.html", type: "ID", value : "ignoreWarningButton"},
  {url : "http://www.mozilla.com/firefox/its-a-trap.html", type: "ID", value : "getMeOutButton"}
];


var setupModule = function(module) {
  controller = mozmill.getBrowserController();
}

var testWaitForPageLoad = function() {
  var win = new elementslib.MozMillElement("Elem", controller.window);

  /**
   * PART I - Check different types of pages
   */
  LOCATIONS.forEach(function (location) {
    controller.open(location.url);
    controller.waitForPageLoad();

    // Check that the expected element exists
    var elem = new elementslib.MozMillElement(location.type, location.value,
                                              {document: controller.tabs.activeTab});
    expect.ok(elem.exists(), "Element '" + location.value + "' has been found.");
  });

  /**
   * PART II - Test different parameter sets
   */
  var location = LOCATIONS[0];
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
  try {
    controller.open(LOCATIONS[0].url);
    controller.waitForPageLoad(0);

    throw new Error("controller.waitForPageLoad() not timed out for timeout=0.");
  } catch (ex) {}

  /**
   * PART IV - Make sure we don't fail when clicking links on a page
   */

  controller.open("http://blog.mozilla.com");
  controller.waitForPageLoad();

  var link = new elementslib.MozMillElement("Selector", "#nav-main-support>a",
                                            {document: controller.tabs.activeTab});
  controller.click(link);
  controller.waitForPageLoad();

  var target = new elementslib.MozMillElement("Selector", "#support-search",
                                           {document: controller.tabs.activeTab});
  controller.waitForElement(target, 1000);

  /**
   * PART V - Loading an iFrame
   */

  // Load the container page
  var page = collector.addHttpResource('./files/') + "iframe.html";
  controller.open(page);
  controller.waitForPageLoad();

  // Get trigger element and the controller for the iFrame
  var trigger = new elementslib.Selector(controller.tabs.activeTab, "#load");
  var frame = new elementslib.Selector(controller.tabs.activeTab, "#iframe");
  var frameWindow = frame.getNode().contentWindow;
  var frameController = new mozmill.controller.MozMillController(frameWindow);

  // Trigger the loading of the iframe from the main controller
  controller.click(trigger);
  controller.waitForPageLoad(frameController.window.document);

  // Once the iframe has been loaded assert that the element exists
  var home = new elementslib.MozMillElement("ID", "home-fx", {document: frameWindow.document});
  expect.ok(home.exists(), "Node in iFrame has been found");

  /**
   * PART VI - Loading a page in another tab should wait for its completion
   */
  var bkgndTabIndex = controller.tabs.activeTabIndex;
  controller.open(LOCATIONS[1].url);

  // Open a new tab now
  controller.keypress(win, "t", {accelKey: true});
  controller.open(LOCATIONS[0].url);

  // Wait for our old tab to load in the background
  controller.waitForPageLoad(controller.tabs.getTab(bkgndTabIndex));

  var element = new elementslib.MozMillElement(LOCATIONS[1].type, LOCATIONS[1].value,
                                               {document: controller.tabs.getTab(bkgndTabIndex)});
  expect.ok(element.exists(), "Element '" + LOCATIONS[1].value + "'in background tab has been found");

  controller.keypress(win, "w", {accelKey: true});

}

