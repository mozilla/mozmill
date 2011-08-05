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

Mozmill is available as an addon and a standard python package.
See [the installation page](./Installation) for instructions for how
to get Mozmill set up on your system.


## The Mozmill Extension

[The Mozmill extension](https://addons.mozilla.org/en-US/firefox/addon/9018)
comes with an integrated development environment, some test authoring
tools, and a graphical interface to run the tests. 

## Python Client

There is a [Mozmill python package](http://pypi.python.org/pypi/mozmill) 
that invokes and runs a Gecko application 

### Running the command line client 

The `mozmill` command is run with one or more test (`-t mytest.js`) or 
test manifest (`-m manifest.ini`):

    mozmill -m functional_tests.ini 
    mozmill -t mytest.js -t myothertest.js

`mozmill --help` displays the available command-line options.


### Control flow

The Mozmill python package bundles the Mozmill and jsbridge extensions
into a profile on running.


### Simple API Usage

An example is available at https://github.com/mozautomation/mozmill/tree/master/mozmill


### Architecture

The Mozmill python package is built of a number of different package dependencies:

- [jsbridge](./jsbridge) : python to JavaScript bridge interface
- [mozrunner](Mozrunner) : Reliable start/stop/configuration of Mozilla Applications (Firefox, Thunderbird, etc.)
- [mozinfo](Mozinfo) : unified Mozilla interface to system information
- [manifestparser](http://hg.mozilla.org/automation/ManifestDestiny) : parses test and addon manifests


### Event Dispatching

Mozmill dispatches events from the JavaScript tests and modules to the
python runner. See [Event Handlers](./EventHandlers).


### Python Callbacks

JavaScript may invoke arbitrary python using the PythonCallbacks
[event handler](./EventHandlers) included with Mozmill. 


### Getting Data to and From the Tests

- [event handlers](./EventHandlers) send data from the JavaScript
  application layer to the python harness

- `persisted` object: a JSObject that is persisted between test runs
  even if the application under test is shutdown or restarted. Each
  `MozMill` instance carries a `persisted` object.


### Restart and Shutdown

JavaScript tests may initiate shutdown and restart of the
browser. There are two types of shutdown/restart events:

- user shutdown
- runner shutdown


## Learning Mozmill Testing

- [Introduction to Mozmill](https://developer.mozilla.org/en/Mozmill/First_Steps/Tutorial%3a_Introduction_to_Mozmill) :
  detailed tutorial that walks through introducing each Mozmill API object as it is needed
- [Mozmill tests](https://developer.mozilla.org/en/Mozmill_Tests) :
  how to setup and run the [QA](http://quality.mozilla.org/) 
  [mozmill tests](http://hg.mozilla.org/qa/mozmill-tests/)

There is API documentation for the Mozmill JavaScript tests

### Mozmill Test API

- [controller object reference](https://developer.mozilla.org/en/Mozmill/Mozmill_Controller_Object)
- [element object reference](https://developer.mozilla.org/en/Mozmill/Mozmill_Element_Object) (Mozmill 2.0+)
- [finding mozmill elements](https://developer.mozilla.org/en/Mozmill/Finding_Mozmill_Elements) (Mozmill 2.0+)
- [mozmill object reference](https://developer.mozilla.org/en/Mozmill/Mozmill_Base_Object_Interfaces)
- [extending the element hierarchy](https://developer.mozilla.org/en/Mozmill/Mozmill_Element_Object/Extending_the_MozMill_element_hierarchy)
- [elementslib object reference](https://developer.mozilla.org/en/Mozmill/Mozmill_Elements_Library_Object)
  (deprecated in Mozmill 2.0 - see 
  [finding mozmill elements](https://developer.mozilla.org/en/Mozmill/Finding_Mozmill_Elements))
- [jum API reference](https://developer.mozilla.org/en/Mozmill/Mozmill_Unit_Test_Framework) (deprecated in Mozmill 2.0)

## Updating the Documentation

See the notes on our [documentation strategy](./Documentation) .


## Resources

Several online resources exist for Mozmill:

- [github repository](https://github.com/mozautomation/mozmill)
- [Python Package Index page](http://pypi.python.org/pypi/mozmill)
- [Auto-tools Mozmill project page](https://wiki.mozilla.org/Auto-tools/Projects/Mozmill) 
  for the development of Mozmill
