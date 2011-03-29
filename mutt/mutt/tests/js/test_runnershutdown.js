/*
 test shutting down and restarting internal to JS:
 https://bugzilla.mozilla.org/show_bug.cgi?id=638989
 Currently, there should be four passing tests:
 Firefox run 1:
 - setupModule + testRunnerRestart
 Firefox run 2:
 - setupModule + testFinal
 */

var setupModule = function(module) {
    module.controller = mozmill.getBrowserController();
};

var testRunnerRestart = function() {
    controller.restartApplication('testFinal');
};

var testFinal = function() {
    controller.stopApplication();
};
