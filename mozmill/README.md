# Mozmill

[Mozmill](https://developer.mozilla.org/en/Mozmill) is a test tool and
UI Automation framework for writing tests and other automation scripts
for Gecko based applications like Firefox and Thunderbird. 
It's built as an
[addon](https://addons.mozilla.org/en-US/firefox/addon/9018/) 
and a Python command-line tool. The addon provides an IDE 
(Integrated Development Environment) for writing and
running the JavaScript tests and the Python package provides a
mechanism for running the tests from the command line as well as
providing a way to test restarting the application. 
Mozmill has an extensive API to help you write functional tests that 
simulate user interactions.

The [Mozmill test automation project](https://wiki.mozilla.org/QA/Mozmill_Test_Automation)
was started in January 2009 and covers the automation work for
Firefox. Checkout the [project page](https://wiki.mozilla.org/QA/Mozmill_Test_Automation)
or have a look at the 
[Mozmill Tests documentation](https://developer.mozilla.org/en/Mozmill_Tests)
to get an impression of how to contribute in writing and running 
[Mozmill tests](https://developer.mozilla.org/en/Mozmill_Tests). 
Existing tests get run in the 
[release
testing](https://developer.mozilla.org/en/Mozmill/Release_Testing)
cycle for new major or security releases of Firefox. 

Also the Mozilla Messaging team has an active project which handles
[Thunderbird Testing with Mozmill](https://developer.mozilla.org/en/Thunderbird/Thunderbird_MozMill_Testing).


## Installation

See [Installation](./Installation) .


## The Extension

[The Mozmill extension](https://addons.mozilla.org/en-US/firefox/addon/9018)
comes with an integrated development environment, some test authoring
tools, and a graphical interface to run the tests. 


## Simple API Usage

An example is available at https://github.com/mozautomation/mozmill/tree/master/mozmill

## Architecture

Mozmill is built of a number of different packages:

- [jsbridge](./jsbridge)
- [mozrunner](./Mozrunner)
- [mozinfo](./Mozinfo)


## Pluggable Event Handlers

Three event handlers are included with Mozmill by default via
the setuptools entry point `mozmill.event_handlers`:

- [Logging](https://github.com/mozautomation/mozmill/blob/master/mozmill/mozmill/logger.py)

- [Report](https://github.com/mozautomation/mozmill/blob/master/mozmill/mozmill/report.py)

- [PythonCallbacks](https://github.com/mozautomation/mozmill/blob/master/mozmill/mozmill/python_callbacks.py)

When running from the command line, these are on by default.  However,
you may use the `--disable` command line argument to turn them off:

    mozmill -t foo.js --disable Logging --report stdout 

This command line will dump just the JSON of the report to stdout.


## Getting Data to and From the Tests

- persisted

## Python Callbacks

## User restart and shutdown

## Updating the Documentation

See the notes on our [documentation strategy](./Documentation) .

## Links

- github repository
- pypi page
- project page