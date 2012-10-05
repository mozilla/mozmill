[Mozmill](https://developer.mozilla.org/en/Mozmill) is a test tool and
UI automation framework for writing tests and other automation scripts
for Gecko based applications like Firefox and Thunderbird. 
It's built as an
[addon](https://addons.mozilla.org/en-US/firefox/addon/9018/) 
and a [python](http://python.org) command-line tool. The addon provides an IDE 
(Integrated Development Environment) for writing and
running JavaScript tests and the python package provides a
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


# Installation

Mozmill is available as an addon and a python package.
See [the installation page](./docs/INSTALL.md) for instructions for how
to get Mozmill set up on your system.


# The Mozmill Extension

[The Mozmill extension](https://addons.mozilla.org/en-US/firefox/addon/9018)
comes with an integrated development environment, some test authoring
tools, and a graphical interface to run the tests. 


# Python Client

There is also a [Mozmill python package](http://pypi.python.org/pypi/mozmill) 
that invokes and runs a Gecko application, performs automatic test scripting,
and accumulates and reports results.


## Running the command line client 

After [installing](./docs/INSTALL.md)
the python package you can run Mozmill with the `mozmill` command.
The `mozmill` command is run with one or more test (`-t mytest.js`) or 
test manifest (`-m manifest.ini`):

    mozmill -m functional_tests.ini 
    mozmill -t mytest.js -t myothertest.js

`mozmill --help` displays the available command-line options and more
in-depth information about the command line utility.  For the format
and usage of test manifests, see
http://hg.mozilla.org/automation/ManifestDestiny/file/tip/README.txt .


## Control flow

The Mozmill python package bundles the Mozmill and [jsbridge](./jsbridge)
extensions into a profile on invocation.

Mozmill is run like:

    mozmill -app firefox -b path/to/binary -t path/to/test.js [options]

This will do the following:

- the application, in this case `firefox`, will be looked for by
  [mozrunner](/en/Mozrunner)

- a [profile object](/en/Mozprofile) will be created of the type
  appropriate to the application under test

- a [python-javascript bridge](./jsbridge) will be created which will
  be used to communicate between the python runner and the JavaScript
  testing environment

- the `test.js` file will be sent over the jsbridge where it is
  loaded and executed (see: 
  [resource://mozmill/modules/frame.js](https://github.com/mozautomation/mozmill/blob/master/mozmill/mozmill/extension/resource/modules/frame.js) )

- events will be sent from JavaScript back to python where they will
  be listened for 
  (see: [resource://mozmill/modules/frame.js](https://github.com/mozautomation/mozmill/blob/master/mozmill/mozmill/extension/resource/modules/frame.js) )  

- upon test run conclusion, the results will be reported by 
  [pluggable event handlers](./docs/event_handlers.md)


## Example API Usage

Since Mozmill 2.0, the 
[MozMill class](https://github.com/mozautomation/mozmill/blob/master/mozmill/mozmill/__init__.py)
is usable as a robust API. An example API usage is available at
https://github.com/mozautomation/mozmill/tree/master/mozmill .


## Architecture

Python Mozmill is a test harness and an event dispatcher.

The Mozmill python package is built of a number of different package dependencies:

- [jsbridge](./jsbridge) : python to JavaScript bridge interface
- [mozrunner](/en/Mozrunner) : Reliable start/stop/configuration of Mozilla Applications (Firefox, Thunderbird, etc.)
- [mozinfo](/en/Mozinfo) : unified Mozilla interface to system information
- [manifestparser](http://hg.mozilla.org/automation/ManifestDestiny) : parses test and addon manifests

See [Architecture](./docs/architecture.md) for additional information on
program design.


## Event Dispatching

Mozmill dispatches events from the JavaScript tests and modules to the
python runner. See [Event Handlers](./docs/event_handlers.md) for how this works.


## Getting Data to and From the Tests

It is desirable to transfer data to and from the JavaScript tests.  There
are a few mechanisms to do so:

- [event handlers](./docs/event_handlers.md) send data from the JavaScript
  application layer to the python harness
- the `persisted` object: a 
  [JSObject](https://github.com/mozautomation/mozmill/blob/master/jsbridge/jsbridge/jsobjects.py) 
  that is persisted between tests
  even if the application under test is shutdown or restarted. Each
  [MozMill](https://github.com/mozautomation/mozmill/blob/master/mozmill/mozmill/__init__.py)
  instance carries a `persisted` object. The amount of
  persisted data must be kept small, however, or [jsbridge](./jsbridge) will fail.
- create your own 
  [JSObject](https://github.com/mozautomation/mozmill/blob/master/jsbridge/jsbridge/jsobjects.py) 
  for finer-tuned control getting data to and from the tests.  

See also 
[Bug 668550 - python should have some way of transfering data to the test on the JS side](https://bugzilla.mozilla.org/show_bug.cgi?id=668550)


## Python Callbacks

JavaScript tests may invoke arbitrary python using the `PythonCallbacks`
[event handler](./docs/event_handlers.md) included with Mozmill. The
[mozmill JavaScript module](https://github.com/mozautomation/mozmill/blob/master/mozmill/mozmill/extension/resource/modules/mozmill.js)
has the `firePythonCallback()` function, which takes the `filename`,
the name of the `method` in the file, a list of ordered `args`, and a
`kwargs` object.  This function will dispatch a
`mozmill.firePythonCallback` [event](./docs/event_handlers.md) to the
[mozmill.python_callbacks module](https://github.com/mozautomation/mozmill/blob/master/mozmill/mozmill/python_callbacks.py)
which will import and fire the appropriate callback.  The `filename`
is relative to the location of the JavaScript test file. Note that any
return value from the python callback will not be sent to the
JavaScript test or otherwise utilized.


See the `mutt` 
[python_callbacks.js test](https://github.com/mozautomation/mozmill/blob/master/mutt/mutt/tests/js/frame/python_callback.js)
and accompanying [python_callbacks.py](https://github.com/mozautomation/mozmill/blob/master/mutt/mutt/tests/js/frame/python_callback.py)
for an example.

It is important for successful runs that the python callback is fired
successfully. Otherwise a [jsbridge](./jsbridge) error will occur via
the python error and the harness will fail.


## Restart and Shutdown

JavaScript tests may initiate shutdown and restart of the
browser. There are two types of shutdown/restart events:

- user shutdown : the test indicates a shutdown or restart.  This does
  not stop the browser but indicates that a further action will cause
  a restart or shutdown (such as triggering `Ctrl+Q`)
- runner shutdown : the test tells the runner to shutdown or restart, 
  potentially giving a next test to run in the same file.

Both cases fire an [event](./docs/event_handlers.md), `mozmill.userShutdown`,
that lets the python harness anticipate the type of shutdown or
restart.  The following parameters are sent with the event:

- `user` : true or false; whether the shutdown was signalled by a
  "user" event
- `restart`: true or false; whether the shutdown is a restart or not
- `next`: name of the next test function to run, in the current test
  file, if any; otherwise the next test file (if any) will be run
- `resetProfile`: true or false; whether to reset the profile to the
  beginning state.  Note that this is not available to user restart
  events as there is a race condition that does not permit the profile
  to be reliably reset before application restart

See the methods `startUserShutdown`, `restartApplication`, and
`stopApplication` on the  
[MozMillController](https://github.com/mozautomation/mozmill/blob/master/mozmill/mozmill/extension/resource/modules/controller.js)
for specifics.

Additionally, `mozmill --restart` signals a harness restart between
every test file.  This is good for isolating test behaviour, but
negative in that the browser restart causes the run to take longer.


# Learning Mozmill Testing

- [Introduction to Mozmill](https://developer.mozilla.org/en/Mozmill/First_Steps/Tutorial%3a_Introduction_to_Mozmill) :
  detailed tutorial that walks through introducing each Mozmill API object as it is needed
- [Mozmill tests](https://developer.mozilla.org/en/Mozmill_Tests) :
  how to setup and run the [QA](http://quality.mozilla.org/) 
  [mozmill tests](http://hg.mozilla.org/qa/mozmill-tests/)

There is API documentation for the Mozmill JavaScript tests.


## Mozmill Test API

- [controller object reference](https://developer.mozilla.org/en/Mozmill/Mozmill_Controller_Object)
- [element object reference](https://developer.mozilla.org/en/Mozmill/Mozmill_Element_Object) (**Mozmill 2.0+**)
- [finding mozmill elements](https://developer.mozilla.org/en/Mozmill/Finding_Mozmill_Elements) (**Mozmill 2.0+**)
- [mozmill object reference](https://developer.mozilla.org/en/Mozmill/Mozmill_Base_Object_Interfaces)
- [extending the element hierarchy](https://developer.mozilla.org/en/Mozmill/Mozmill_Element_Object/Extending_the_MozMill_element_hierarchy)
- [elementslib object reference](https://developer.mozilla.org/en/Mozmill/Mozmill_Elements_Library_Object)
  (*deprecated in Mozmill 2.0* - see 
  [finding mozmill elements](https://developer.mozilla.org/en/Mozmill/Finding_Mozmill_Elements))
- [assertions API reference](https://developer.mozilla.org/en/Mozmill/Mozmill_Unit_Test_Framework)


# Finding and Reporting Bugs

Mozmill is under active development. Check out the 
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


# Updating the Documentation

The [MDN](http://developer.mozilla.org/en/Mozmill) pages are mirrored
from the [mozmill repository](https://github.com/mozautomation/mozmill).
See the notes on our [documentation strategy](../documentation.md) .


# Resources

Several online resources exist for Mozmill:

- [MDN Mozmill page](http://developer.mozilla.org/en/Mozmill)
- [github repository](https://github.com/mozautomation/mozmill)
- [Python Package Index page](http://pypi.python.org/pypi/mozmill)
- [Auto-tools Mozmill project page](https://wiki.mozilla.org/Auto-tools/Projects/Mozmill) 
  for the development of Mozmill

In addition a `#mozmill` channel exists on irc://irc.mozilla.org/
. Please stop by and say hi!