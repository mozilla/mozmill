2.0.3 / 2013-12-20
==================

  * Bug 951715 - Mozmill fails to properly initialize metro mode
  * Bug 771425 - Uploading report sometimes fails with 'No JSON object could be decoded'
  * Bug 951628 - When Firefox gets closed via shutdownApplication() we do not wait until runner process has been quit
  * Bug 950263 - MozElement.mouseEvent() misses sleep(0) call which causes intermittent failures

2.0.2 / 2013-12-11
==================

  * Bug 948120 - Bump mozbase dependencies to fix rmtree/remove issues in Mozmill and fixup import lines
  * Bug 946672 - Get the App Name based on the App ID first, use Services.appinfo.name as fallback

2.0.1 / 2013-11-19
==================

  * Bug 939978 - Bump to mozrunner 5.27 with a lot of add-on related fixes
  * Bug 939708 - Remove deprecated checkboxes from radio button Mutt test
  * Bug 583379 - Remove allowevents checking for dynamic menu building
  * Bug 935954 - Mozmill should not be allowed to modify the profile_args and
                 runner_args objects from the caller
  * Bug 933053 - Remove all mentions of addon in README files
  * Bug 922995 - Change flag to force-quit when closing the application
  * Bug 928277 - Python test_no_abort_via_client_tests in test_console_errors.py fails
  * Bug 927762 - Mutt test failure in tests/python/test_addons.py
  * Bug 925632 - Upgrade httpd.js for speed-up fixes on bug 777354
  * Bug 895841 - Add --app option to mutt

2.0 / 2013-09-24
================

  * Final release of Mozmill 2.0 (no further changes since 2.0rc6)

2.0rc6 / 2013-09-19
===================

  * Bug 918255 - Filter out functions from addon properties because they break JSON.stringify()
  * Bug 912941 - Update mozelement.select() to not use scrollIntoView() itself
  * Bug 885221 - Page hide event does not update window status if persisted is true
  * Bug 915554 - Fix handling of the old private browsing mode for Firefox 17.0 ESR
  * Bug 912941 - Call scrollIntoView only if available
  * Bug 914528 - Skip XUL menulist check if it is not present plugins section

2.0rc5 / 2013-08-27
===================

* Bug 897414 - Global console listener should also care about exceptions and not only errors
* Bug 797715 - --console-level=[INFO|WARNING] shouldn't show failure stack
* Bug 880426 - Enhance MozElement with touch events
* Bug 899137 - Move all testcase data files to mutt/mutt/tests/data
* Bug 871441 - Allow select method to handle xul:menulists
* Bug 898378 - Correctly close the opened context menu in testExpectedEvents.js
* Bug 905556 - Bump python dependencies for latest mozbase versions and sync setup_development.py script
* Bug 899274 - Update test_manifest_and_tests_exclusive.py with correct argument path values
* Bug 897933 - testMultipleLoads.js fails because httpd.js internally loads favicon.ico
* Bug 898865 - Rename mutt python _files/ data dir to data/ and adjust tests accordingly
* Bug 767286 - Fix test, manifest, and directory names for Mutt tests to make the test collector work again
* Bug 897957 - Improve retrieval and handling of add-on information
* Bug 897464 - /js/frame/restart/states/setuptest_skip.js fails with: Only setupModule ran prior to teardownTest so state is 1 - '3' should equal '1'
* Bug 791634 - Make waitFor() method available in the assertions module
* Bug 885141 - Failure in setup* or teardown* methods are not always counted
* Bug 897005 - Fix mozelement_window.js test to start from a clean state
* Bug 895657 - State machines will not work because setupTest() and teardownTest() are only called once at the beginning and end of a module
* Bug 895803 - controller.open() doesn't work in Metro mode due to missing stop() method on the browser object
* Bug 799557 - mutt test failure on js/frame/httpd/testHTTPd2.js
* Bug 885124 - Individual checks for the persisted object
* Bug 887315 - Unskipped window_focus.js mutt test for linux & skipped for older versions than 25
* Bug 893026 - Python framework wrongly assumes to restart the application while it has already been done by the extension
* Bug 865641 - Very first waitForPageLoad() can fail if the startup page takes too long to load
* Bug 881657 - Run httpd.js globally and don't start/stop the server for each test
* Bug 887931 - Don't raise framework failures for background thread exceptions in tests
* Bug 865690 - Assertion failure and shutdown crash: !"I/O method is invalid", at /nsprpub/pr/src/io/priometh.c:54 because jsbridge calling recv after socket
* Bug 887202 - Add errors module to have a central location for custom errors
* throws() and doesNotThrow() methods in the assertions module do not correctly handle native errors
* Bug 846007 - Updated controller.dragToElement() method
* Bug 868375 - Change the assertions.js module so that Assert is the base class instead of Expect
* Bug 884768 - Clean-up contents of frame.js
* Bug 870384 - Improve Mutt's Python tests for clarity in naming and structure

2.0rc4 / 2013-06-14
===================

* Bug 879371 - Add support for tabs and window handling for Firefox Metro
* Bug 876399 - Mozmill module loader should prevent leaking of symbols through the global object by using a sandbox
* Bug 874895 - Upgrade EventUtils to most recent version
* Bug 879371 - Allow Mozmill to close Firefox Metro
* Bug 860662 - controller.select() fails to select the option by value
* Bug 872237 - ChromeWindows cannot be initialized correctly because onWindowLoaded is called sometimes even with window not finished loading yet
* Bug 795579 - waitFor method doesn't send a pass frame which can cause an application disconnect when handled in a loop
* Bug 860659 - elementslib.Lookup() fails if element in reduceLookup() does not exist yet
* Bug 870799 - Update windowMap API to always use outer window id as parameter

2.0rc3 / 2013-05-08
===================

* Bug 803492 - Set window.focus() in mozmill controller
* Bug 760720 - waitForPageLoad() method still augments elements into window object
* Bug 868384 - Convert assertions.js and stack.js to an old style module to be loadable by controller.js
* Bug 864268 - Lookup class does no longer expose the  property
* Bug 864375 - createInstance() should fallback to MozMillElement if element does not exist yet
* Bug 761600 - Stale elements do not work since CPG (compartment per global) has been landed
* Bug 868203 - MozMillElement subclasses should inherit via Object.create()
* Bug 862990 - Remove end of line whitespace from mutt/mozmill files
* Bug 859589 - Mutt tests should print the total amount of passed/failed/skipped tests at the end
