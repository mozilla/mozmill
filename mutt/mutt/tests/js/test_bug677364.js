var setupModule = function(module) {
  controller = mozmill.getBrowserController();
}

var test_windowKeypress = function() {
    controller.keypress(null, 't', {'ctrlKey':true});
    controller.sleep(1000);
}
