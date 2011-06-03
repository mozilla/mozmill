var testPythonCallback = function() {
    mozmill.firePythonCallback('test_python_callbacks.py', 
                               'nowCallback',
                               ['test'])
}
