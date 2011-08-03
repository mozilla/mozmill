# Mozmill

[Mozmill](https://developer.mozilla.org/en/Mozmill) is a UI Automation
framework for Mozilla apps like Firefox and Thunderbird. It's both an
[addon](https://addons.mozilla.org/en-US/firefox/addon/9018/) and a
Python command-line tool. The addon provides an IDE for writing and
running the JavaScript tests and the Python package provides a
mechanism for running the tests from the command line as well as
providing a way to test restarting the application. 

### Simple API Usage

### Accumulating Results

### Pluggable Event Handlers

Three event handlers are included with Mozmill by default via
the setuptools entry point 'mozmill.event_handlers':

- Logging

- Report

- PythonCallbacks

When running from the command line, these are on by default.  However,
you may use the '--disable' command line flag to turn them off:

    mozmill -t foo.js --disable Logging --report stdout 

This command line will dump just the JSON of the report to stdout.


### Getting Data to and From the Tests

- persisted

### Python Callbacks

### User restart and shutdown

