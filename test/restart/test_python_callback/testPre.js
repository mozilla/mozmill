var mozmill = {}; Components.utils.import('resource://mozmill/modules/mozmill.js', mozmill);

var testPythonCallNow = function() {
  mozmill.firePythonCallback("nowCallback", null)
}

var testPythonFail = function() {
  mozmill.firePythonCallback("failCallback", null)
}
