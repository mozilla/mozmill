/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

Cu.import("resource://gre/modules/AddonManager.jsm");


function testAddons() {
  persisted.addons = getAddons();
}

/**
 * Retrieve the list of installed add-ons
 */
function getAddons() {
  var addons = null;

  AddonManager.getAllAddons(function (addonList) {
    addons = addonList;
  });

  try {
    // Sychronize with getAllAddons so we do not return too early
    assert.waitFor(function () {
      return !!addons;
    })

    return addons;
  } catch (e) {
    return null;
  }
}
