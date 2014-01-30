"use strict";

var setupModule = function(aModule) {
  aModule.controller = mozmill.getBrowserController();
}

var testNewPageLoaded = function () {
  controller.open('https://addons.mozilla.org/firefox/downloads/latest/360093/addon-360093-latest.xpi?src=dp-btn-primary');
  controller.waitForPageLoad();
}
