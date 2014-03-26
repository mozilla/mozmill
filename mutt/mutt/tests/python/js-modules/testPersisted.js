/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

function setupModule() {
  controller = mozmill.getBrowserController();
}

function test() {
  persisted.bar = 'bar';
  persisted.fleem = 2;
  persisted.number += 1;

  delete persisted.foo;
}
