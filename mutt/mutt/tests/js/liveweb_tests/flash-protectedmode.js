/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const TEST_DOMAIN = "http://www.mozqa.com/";
const TEST_PAGE = TEST_DOMAIN + "data/firefox/plugins/flash/test_swf_embed_nosound.html";

const TIMEOUT_PAGE = 50000;

function setupModule() {
  controller = mozmill.getBrowserController();
}

/*
 * Test opening embeded flash content
 */
function testFlashViaEmbedTag() {
  controller.open(TEST_PAGE);
  controller.waitForPageLoad(TIMEOUT_PAGE);
}
