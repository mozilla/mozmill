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
