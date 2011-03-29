var testPythonCallback = function() {
    mozmill.firePythonCallback('test_python_callbacks_callbacks.py', 
                               'nowCallback',
                               ['test'])
}
