/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { getProperty } = require("l10n");


const PROPERTIES_FILE = "chrome://global/locale/languageNames.properties";


var test = function () {
  // Test a known property
  try {
    let value = getProperty(PROPERTIES_FILE, "en");
    expect.ok(value, "Localized content of a known property has been retrieved");
  } catch (e) {
    expect.fail("Localized content of a known property has not been retrieved");
  }

  // Test an invalid property
  try {
    getProperty(PROPERTIES_FILE, "test_property");
    expect.fail("Localized content of an unknown property has been retrieved");
  } catch (e) {
    expect.pass("Localized content of an unknown property has not been retrieved");
  }
}
