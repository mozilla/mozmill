/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

const BASE_URL = collector.addHttpResource("../../../data/");

const TEST_FILE = "singlediv.html";
const TEST_DATA = [baseurl + TEST_FILE,
                   collector.addHttpResource("../../../data/", TEST_FILE)]

function testAddHttpResourceBackwardsCompatibility() {
  assert.equal(baseurl, BASE_URL,
               "addHttpResource returns the correct server address");
  assert.equal(TEST_DATA[0], TEST_DATA[1],
               "addHttpResource aPath argument works correctly");
}
