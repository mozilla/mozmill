var mozmill = {}; Components.utils.import('resource://mozmill/modules/mozmill.js', mozmill);

var testPythonCallPost = function() {
  mozmill.firePythonCallbackAfterRestart("postCallback", null)
}