/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

Components.utils.import('resource://mozmill/modules/jum.js');

var setupModule = function(module) {
  controller = mozmill.getBrowserController();
};

var testProperty = function() {
  var res;

  var menu_item = new elementslib.ID(controller.window.document, 'file-menu');
  controller.click(menu_item);

  var new_tab_menu_item = new elementslib.ID(controller.window.document,
                                             'menu_newNavigatorTab');
  res = controller.assertProperty(new_tab_menu_item, 'command', 'cmd_newNavigatorTab');
  assertEquals(true, res);

  res = controller.assertProperty(new_tab_menu_item, 'command', '');
  assertEquals(false, res);
};

var testPropertyNotEquals = function() {
  var res;

  var menu_item = new elementslib.ID(controller.window.document, 'file-menu');
  controller.click(menu_item);

  var new_tab_menu_item = new elementslib.ID(controller.window.document,
                                             'menu_newNavigatorTab');
  res = controller.assertPropertyNotEquals(new_tab_menu_item, 'command', 'cmd_newNavigatorTab');
  assertEquals(false, res);

  res = controller.assertPropertyNotEquals(new_tab_menu_item, 'command', '');
  assertEquals(true, res);
};

