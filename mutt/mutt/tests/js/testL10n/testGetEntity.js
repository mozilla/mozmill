/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

const { getEntity } = require("l10n");

const TEST_DATA = "chrome://branding/locale/brand.dtd";

var test = function () {
  // Test a known entity
  try {
    let value = getEntity([TEST_DATA], "vendorShortName");
    expect.ok(value, "Localized content of a known entity has been retrieved");
  } catch (e) {
    expect.fail("Localized content of a known entity has not been retrieved");
  }

  // Test an invalid entity
  try {
    getEntity([TEST_DATA], "test_entity");
    expect.fail("Localized content of an unknown entity has been retrieved");
  } catch (e) {
    expect.pass("Localized content of an unknown entity has not been retrieved");
  }
}
