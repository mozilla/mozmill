var setupModule = function() {
  controller = mozmill.getBrowserController();
}

var testErrorConsole = function() {
  controller.open("http://www.mozilla.org");
  controller.waitForPageLoad();

  // syntax error
  var syntaxError = ;
  
  // execution error
  test();
}
