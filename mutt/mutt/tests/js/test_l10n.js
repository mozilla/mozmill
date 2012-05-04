/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var l10n = require("l10n");

function setupModule(module) {
}


function teardownModule(module) {
}


/**
 * Test the l10n support
 */
function testL10n() {
  let dtd = "chrome://branding/locale/brand.dtd";
  let property = "chrome://global/locale/languageNames.properties";

  // Test a known entity
  try {
    let value = l10n.getEntity([dtd], "vendorShortName");
    expect.ok(value, "Localized content of a known entity has been retrieved");
  }
  catch (ex) {
    expect.fail("Localized content of a known entity has not been retrieved");
  }

  // Test an unknown entity
  try {
    l10n.getEntity([dtd], "vendorSortName");
    expect.fail("Localized content of an unknown entity has been retrieved");
  }
  catch (ex) {
    expect.pass("Localized content of an unknown entity has not been retrieved");
  }

  // Test a known property
  try {
    let value = l10n.getProperty(property, "en");
    expect.ok(value, "Localized content of a known property has been retrieved");
  }
  catch (ex) {
    expect.fail("Localized content of a known property has not been retrieved");
  }

  // Test an unknown property
  try {
    l10n.getProperty(property, "abc");
    expect.fail("Localized content of an unknown property has been retrieved");
  }
  catch (ex) {
    expect.pass("Localized content of an unknown property has not been retrieved");
  }
}
