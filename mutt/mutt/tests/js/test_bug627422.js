/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Mozmill Test Code.
 *
 * The Initial Developer of the Original Code is Mozilla Foundation.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Aakash Desai <adesai@mozilla.com>
 *   Henrik Skupin <hskupin@mozilla.com>
 *   Aaron Train <atrain@mozilla.com>
 *   Geo Mealer <gmealer@mozilla.com>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

/* So for a syntax error you get:

   ERROR | Test Failure: {"message": "[JavaScript Error: \"syntax error\" {file: \"resource://mozmill/modules/frame.js -> file:///home/jhammel/mozmill/src/mozmill/mutt/mutt/tests/js/test_bug627422.js\" line: 57 column: 8 source: \"    1 + ;\n\"}]"}

For a undefined.undefined TypeError you get:

   ERROR | Test Failure: {"exception": {"stack": "()@resource://mozmill/modules/frame.js -> file:///home/jhammel/mozmill/src/mozmill/mutt/mutt/tests/js/test_bug627422.js:62\n((function () {var importer = Cc['@mozilla.org/browser/places/import-export-service;1'].getService(Ci.nsIPlacesImportExportService);mozmill.foo.bar;log(cm);log(importer);}))@resource://mozmill/modules/frame.js:499\n([object Object])@resource://mozmill/modules/frame.js:553\n(\"/home/jhammel/mozmill/src/mozmill/mutt/mutt/tests/js/test_bug627422.js\",null)@resource://mozmill/modules/frame.js:463\n(\"/home/jhammel/mozmill/src/mozmill/mutt/mutt/tests/js/test_bug627422.js\",false,null)@resource://mozmill/modules/frame.js:588\n((function (filename, invokedFromIDE, name) {var runner = new Runner(new Collector, invokedFromIDE);runner.runTestFile(filename, name);runner.end();return true;}),[object Proxy])@resource://jsbridge/modules/bridge.js:135\n(\"25f92cb2-b187-11e0-9250-00262df16844\",(function (filename, invokedFromIDE, name) {var runner = new Runner(new Collector, invokedFromIDE);runner.runTestFile(filename, name);runner.end();return true;}),[object Proxy])@resource://jsbridge/modules/bridge.js:139\n", "message": "mozmill.foo is undefined", "fileName": "resource://mozmill/modules/frame.js -> file:///home/jhammel/mozmill/src/mozmill/mutt/mutt/tests/js/test_bug627422.js", "name": "TypeError", "lineNumber": 62}}

Misspelling Cc["@mozilla.org/browser/places/import-export-service;1"].getService(Ci.nsIPlacesImportExportService);
-> Cc["@mozilla.org/browser/places/import-export-service;1"].getService(Ci.nsIPlacesImportExportServi);

   ERROR | Test Failure: {"exception": {"message": "Component returned failure code: 0x80570018 (NS_ERROR_XPC_BAD_IID) [nsIJSCID.getService]", "name": "NS_ERROR_XPC_BAD_IID", "lineNumber": 63}}

 */

var setupModule = function() {
  controller = mozmill.getBrowserController();
  cm = Cc["@mozilla.org/cookiemanager;1"].
       getService(Ci.nsICookieManager2);
  cm.removeAll();
}

var teardownModule = function() {
  cm.removeAll();
}

var testBadSpelling = function() {
    var importer = Cc["@mozilla.org/browser/places/import-export-service;1"].getService(Ci.nsIPlacesImportExportServi);
    log(cm);
    log(importer);

}

