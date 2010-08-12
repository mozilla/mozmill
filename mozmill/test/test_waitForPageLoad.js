const LOCATIONS = [
  // Normal pages
  {url : "http://www.google.de", timeout : undefined, type: "id", value : "logo"},
  {url : "https://addons.mozilla.org", timeout : undefined, type: "id", value : "query"},
  {url : "http://addons.mozilla.org", timeout : undefined, type: "id", value : "query"},

  // FTP pages
  {url : "ftp://ftp.mozilla.org/pub/", timeout : undefined, type : "link", value : "firefox" },

  // Error pages
  {url : "https://mur.at", timeout : 1000, type: "id", value : "cert_domain_link"},
  {url : "http://www.mozilla.com/firefox/its-a-trap.html", timeout : 1000, type: "id", value : "ignoreWarningButton"},
  {url : "https://mozilla.org/", timeout : 1000, type: "id", value : "getMeOutOfHereButton"}
];

var setupTest = function() {
  controller = mozmill.getBrowserController();
}

var testWaitForPageLoad = function() {
  var tab = controller.tabs.activeTab;

  /**
   * PART I - Check different types of pages
   */
  for each (var location in LOCATIONS) {
    controller.open(location.url);
    controller.waitForPageLoad(location.timeout);
  
    // Check that the expected element exists
    if (location.type) {
      var elem = null;
  
      switch (location.type) {
        case "link":
          elem = new elementslib.Link(tab, location.value);
          break;
        case "name":
          elem = new elementslib.Name(tab, location.value);
          break;
        case "id":
          elem = new elementslib.ID(tab, location.value);
          break;
        default:
      }
  
      controller.assertJS("subject.localName != undefined", elem.getNode());
    }
  }
  
  /**
   * PART II - Test different parameter sets
   */ 
  var location = LOCATIONS[0];
  for (var i = 0; i < 7; i++) {
    controller.open(location.url);
  
    switch (i) {
      case 0:
        controller.waitForPageLoad(tab, location.timeout);
        break;
      case 1:
        controller.waitForPageLoad(tab, location.timeout, 10);
        break;
      case 2:
        controller.waitForPageLoad(tab, "invalid");
        break;
      case 3:
        controller.waitForPageLoad(undefined, location.timeout, 100);
        break;
      case 4:
        controller.waitForPageLoad(null, location.timeout, 100);
        break;
      case 5:
        controller.waitForPageLoad("invalid", location.timeout);
        break;
      case 6:
        controller.waitForPageLoad(location.timeout, "invalid");
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
  controller.open("http://www.mozilla.org");
  controller.waitForPageLoad();

  var link = new elementslib.Link(controller.tabs.activeTab, "Get Involved");
  controller.click(link);
  controller.waitForPageLoad();

  var target = new elementslib.Name(controller.tabs.activeTab, "area");
  controller.waitForElement(target, 1000);

  /**
   * PART V - When waitForPageLoad is called when the page has already been loaded
   * we shouldn't fail
   */
  controller.open(LOCATIONS[0].url);
  controller.waitForPageLoad();
  controller.waitForPageLoad(500);
}

