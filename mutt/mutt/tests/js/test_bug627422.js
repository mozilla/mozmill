/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

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

