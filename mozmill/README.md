# Mozmill

[Mozmill](https://developer.mozilla.org/en/Mozmill) is a test tool and
UI automation framework for writing tests and other automation scripts
for Gecko based applications like Firefox and Thunderbird. 
It's built as an
[addon](https://addons.mozilla.org/en-US/firefox/addon/9018/) 
and a [python](http://python.org) command-line tool. The addon provides an IDE 
(Integrated Development Environment) for writing and
running the JavaScript tests and the python package provides a
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
[release testing](https://developer.mozilla.org/en/Mozmill/Release_Testing)
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
that invokes and runs a Gecko application, performing automatic test scripting,
and accumulating and reporting results.


### Running the command line client 

The `mozmill` command is run with one or more test (`-t mytest.js`) or 
test manifest (`-m manifest.ini`):

    mozmill -m functional_tests.ini 
    mozmill -t mytest.js -t myothertest.js

`mozmill --help` displays the available command-line options.


### Control flow

The Mozmill python package bundles the Mozmill and jsbridge extensions
into a profile on running.

Mozmill is run like:

    mozmill -app firefox -t path/to/test.js [options]

This will do the following:

- the application, in this case `firefox`, will be looked for (see:
  mozrunner)

- a [profile](Mozprofile) object will be created of the approriate type 

- a [python-javascript bridge](./jsbridge) will be created

- the `test.js` file will be sent over the jsbridge where it is
  loaded and executed (see: resource://mozmill/modules/frame.js )

- events will be sent from JavaScript back to python where they will
  be listened for (see: resource://mozmill/modules/frame.js )  


### Simple API Usage

Since Mozmill 2.0, the 
[MozMill class](https://github.com/mozautomation/mozmill/blob/master/mozmill/mozmill/__init__.py)
is usable as a robust API. An example is available at
https://github.com/mozautomation/mozmill/tree/master/mozmill .


### Architecture

Python Mozmill is a test harness and an event dispatcher.

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

It is often desirable to transfer data to and from the tests.  There
are a few mechanisms to do so:

- [event handlers](./EventHandlers) send data from the JavaScript
  application layer to the python harness
- `persisted` object: a 
  [JSObject](https://github.com/mozautomation/mozmill/blob/master/jsbridge/jsbridge/jsobjects.py) 
  that is persisted between test runs
  even if the application under test is shutdown or restarted. Each
  [MozMill](https://github.com/mozautomation/mozmill/blob/master/mozmill/mozmill/__init__.py)
  instance carries a `persisted` object. The amount of
  persisted data must be kept small, however, or [jsbridge](./jsbridge) will fail.
- create your own 
  [JSObject](https://github.com/mozautomation/mozmill/blob/master/jsbridge/jsbridge/jsobjects.py) 
  for finer-tuned control getting data to and from the tests.  
    


### Restart and Shutdown

JavaScript tests may initiate shutdown and restart of the
browser. There are two types of shutdown/restart events:

- user shutdown : 
- runner shutdown


## Learning Mozmill Testing

- [Introduction to Mozmill](https://developer.mozilla.org/en/Mozmill/First_Steps/Tutorial%3a_Introduction_to_Mozmill) :
  detailed tutorial that walks through introducing each Mozmill API object as it is needed
- [Mozmill tests](https://developer.mozilla.org/en/Mozmill_Tests) :
  how to setup and run the [QA](http://quality.mozilla.org/) 
  [mozmill tests](http://hg.mozilla.org/qa/mozmill-tests/)

There is API documentation for the Mozmill JavaScript tests.


### Mozmill Test API

- [controller object reference](https://developer.mozilla.org/en/Mozmill/Mozmill_Controller_Object)
- [element object reference](https://developer.mozilla.org/en/Mozmill/Mozmill_Element_Object) (**Mozmill 2.0+**)
- [finding mozmill elements](https://developer.mozilla.org/en/Mozmill/Finding_Mozmill_Elements) (**Mozmill 2.0+**)
- [mozmill object reference](https://developer.mozilla.org/en/Mozmill/Mozmill_Base_Object_Interfaces)
- [extending the element hierarchy](https://developer.mozilla.org/en/Mozmill/Mozmill_Element_Object/Extending_the_MozMill_element_hierarchy)
- [elementslib object reference](https://developer.mozilla.org/en/Mozmill/Mozmill_Elements_Library_Object)
  (*deprecated in Mozmill 2.0* - see 
  [finding mozmill elements](https://developer.mozilla.org/en/Mozmill/Finding_Mozmill_Elements))
- [jum API reference](https://developer.mozilla.org/en/Mozmill/Mozmill_Unit_Test_Framework) (*deprecated in Mozmill 2.0*)


## Finding and Reporting Bugs

Mozmill is in an active stage of development. Check out the 
[Auto-tools Mozmill project page](https://wiki.mozilla.org/Auto-tools/Projects/Mozmill)
for information on development. If you think you've found a bug in Mozmill,
please check the 
[list of existing bugs](https://bugzilla.mozilla.org/buglist.cgi?resolution=---&component=Mozmill&product=Testing). 
If your found bug is not listed there, please 
[file a new bug](https://bugzilla.mozilla.org/enter_bug.cgi?product=Testing&component=Mozmill)
in [bugzilla](https://bugzilla.mozilla.org/)
under the "Testing" Product and "Mozmill" Component. Please
provide as much as possible details and attach the Mozmill test if
available, which shows the problem. Thanks for helping us make Mozmill
better! 


## Updating the Documentation

See the notes on our [documentation strategy](./Documentation) .


## Resources

Several online resources exist for Mozmill:

- [github repository](https://github.com/mozautomation/mozmill)
- [Python Package Index page](http://pypi.python.org/pypi/mozmill)
- [Auto-tools Mozmill project page](https://wiki.mozilla.org/Auto-tools/Projects/Mozmill) 
  for the development of Mozmill
