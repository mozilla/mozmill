// test opening a page

var setupModule = function(module) {
    controller = mozmill.getBrowserController();
}

var testOpen = function() {
  var url = 'http://mozilla.org'; // the actual URL is incidental

  controller.open(url);
  controller.waitForPageLoad();
}