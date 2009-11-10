var jum = {}; Components.utils.import('resource://mozmill/modules/jum.js', jum);

var testPythonCallNow = function() {
  var state = ""
  mozmill.firePythonCallback("nowCallback", state)
  jum.assertEquals(state, "pre");
}

var testPythonFail = function() {
  try {
    mozmill.firePythonCallback("failCallback", null);
    throw new Error("Python Callback hasn't thrown exception.");
  } catch (ex) {
    // We expect to have an assertion
  }
}
