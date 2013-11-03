/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { getEntity } = require("l10n");

const BASE_URL = collector.addHttpResource("../../data/");
const TEST_DATA = [
  BASE_URL + "form.html",
  "chrome://mozmill/content/test/chrome_elements.xul"
];

const TIMEOUT_REMOTE = 15000;

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();
}

function testContentSelect() {
  controller.open(TEST_DATA[0]);
  controller.waitForPageLoad();

  var dropdown = new elementslib.ID(controller.tabs.activeTab, "state");

  // Select by index, item not in view
  dropdown.select(20);
  expect.equal(dropdown.getNode().selectedIndex, 20, "Index has been selected")
  expect.equal(dropdown.getNode().value, "MD", "Value has been selected");

  // Select by value
  dropdown.select(null, null, 'AK');
  expect.equal(dropdown.getNode().value, "AK", "Value has been selected");

  // Select by option
  dropdown.select(null, 'Alabama');
  expect.equal(dropdown.getNode().value, "AL", "Value has been selected");
}

function testChromeSelect() {
  controller.open(TEST_DATA[1]);
  controller.waitForPageLoad();

  var menulist = new elementslib.ID(controller.window.document, "menulist");

  // Select by index, item not in view
  menulist.select(20);
  expect.equal(menulist.getNode().selectedIndex, 20, "Index has been selected")
  expect.equal(menulist.getNode().value,'MD', "Value has been selected");

  // Select by value
  menulist.select(null, null, 'AZ');
  expect.equal(menulist.getNode().value, 'AZ', "Value has been selected");

  // Select by option
  menulist.select(null, 'Missouri');
  expect.equal(menulist.getNode().value, 'MO', "Value has been selected");
}

function testXULMenuList() {
  // Open Addons Manager and add an event listener to wait for the view to change
  var self = { changed: false };
  function onViewChanged() { self.changed = true; }
  controller.window.document.addEventListener("ViewChanged",
                                              onViewChanged, false);

  controller.open("about:addons");
  controller.waitForPageLoad();

  assert.waitFor(function () {
    return self.changed;
  }, "Category 'Discovery' has been loaded.", TIMEOUT_REMOTE);

  self = { changed: false };

  var plugin = new elementslib.ID(controller.window.document, "category-plugin");
  controller.click(plugin);
  assert.waitFor(function () {
    return self.changed;
  }, "Category has been changed.");

  this.controller.window.document.removeEventListener("ViewChanged",
                                                      onViewChanged, false);

  // Select by option
  var parent = controller.tabs.activeTab.querySelector(".addon.addon-view");
  var node = controller.tabs.activeTab.
             getAnonymousElementByAttribute(parent, "anonid", "state-menulist");

  // ESR17 does not have a xul menulist in Addons Manager - Plugins, neither dtds
  if (node) {
    var menulist =  new elementslib.Elem(node);
    var dtd = "chrome://mozapps/locale/extensions/extensions.dtd";
    var neverActivate = getEntity([dtd], "cmd.neverActivate.label");
    menulist.select(null, neverActivate);
    expect.equal(menulist.getNode().label, neverActivate,
                 "Never activate value has been selected");

    var alwaysActivate = getEntity([dtd], "cmd.alwaysActivate.label");
    dump('alwaysActivate:' + alwaysActivate);
   dump_list("ZUL", menulist.options); 
   menulist.select(null, alwaysActivate);
 //   expect.equal(menulist.getNode().label, alwaysActivate,
//                 "Always activate value has been selected");
  }
}
