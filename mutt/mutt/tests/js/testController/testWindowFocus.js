/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

Cu.import("resource://gre/modules/Services.jsm");

const TEST_DATA = baseurl + "complex.html";

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();
  aModule.windowController1 = null;
  aModule.windowController2 = null;
}

function testMenu() {
  controller.open(TEST_DATA);
  controller.waitForPageLoad();

  // Open 2 windows
  var window1 = controller.window.open(TEST_DATA);
  var window2 = controller.window.open(TEST_DATA);

  // Instantiate controller for 2nd window
  windowController2 = new mozmill.controller.MozMillController(window2);

  // Check initial order
  var enumerator = Services.wm.getZOrderDOMWindowEnumerator(null, false);
  var initialWindowsOrder = [];
  while (enumerator.hasMoreElements()) {
    var id = mozmill.utils.getWindowId(enumerator.getNext());
    initialWindowsOrder.push(id);
  }

  // Instantiate controller for 1nd window
  windowController1 = new mozmill.controller.MozMillController(window1);

  // Check order after controller instantiation
  enumerator = Services.wm.getZOrderDOMWindowEnumerator(null, false);
  var finalWindowsOrder = [];
  while (enumerator.hasMoreElements()) {
    var id = mozmill.utils.getWindowId(enumerator.getNext());
    finalWindowsOrder.push(id);
  }

  // Check that the Z order has been maintained
  assert.deepEqual(initialWindowsOrder, finalWindowsOrder,
                   "Windows have maintained their order");
}

function teardownModule(aModule) {
  aModule.windowController1.window.close();
  aModule.windowController2.window.close();
}

if (Services.vc.compare(Services.appinfo.version, "25.0a1") < 0) {
  setupModule.__force_skip__ = "Bug 887718 - Windows are being incorrectly " +
                               "reordered when focused with testMode " +
                               "enabled prior to Firefox 25";
  teardownModule.__force_skip__ = "Bug 887718 - Windows are being incorrectly " +
                                  "reordered when focused with testMode " +
                                  "enabled prior to Firefox 25";
}
