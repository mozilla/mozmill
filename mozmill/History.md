2.0rc3 / 2013-06-14
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
