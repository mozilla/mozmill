/*
 A long test to trigger a JSBridge global timeout
 see:
 - https://bugzilla.mozilla.org/show_bug.cgi?id=584470
 - https://github.com/mozautomation/mozmill/blob/master/mozmill/mozmill/__init__.py#L69
 */

var setupModule = function(module) {
    module.controller = mozmill.getBrowserController();
};

var testTakesTooLong = function() {
    controller.sleep(120000); // ms
};
