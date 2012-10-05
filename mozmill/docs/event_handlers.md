[Mozmill](https://developer.mozilla.org/en/Mozmill) 
is an event dispatcher system, using jsbridge to communicate
events triggered in JavaScript to the python harness.


# Events

Events send the signature `(eventType, obj)`.  `eventType` is
the string name of the event (e.g. `mozmill.endTest`) and `obj` is
an object sent with the event.  A python callable signature for a given event
takes `obj` as an argument, e.g:

    self.add_listener(self.persist_listener, eventType="mozmill.persist")
    def persist_listener(self, obj):
        self.persisted = obj

Several event listeners are added in the 
[Mozmill constructor](https://github.com/mozautomation/mozmill/blob/master/mozmill/mozmill/__init__.py)
vital for test harness functionality. In addition, handlers may be
passed to the constructor from which event listeners may be added.


# Pluggable Event Listeners

Mozmill allows python classes to plug into the event listener system.
This is done by denoting them as a 
[setuptools entry point](http://peak.telecommunity.com/DevCenter/setuptools#dynamic-discovery-of-services-and-plugins)
with the key `mozmill.event_handlers` in the `entry_points` section (see mozmill's 
[setup.py](https://github.com/mozautomation/mozmill/blob/master/mozmill/setup.py)).

Three event handlers are included with Mozmill by default via
the setuptools entry point `mozmill.event_handlers`:

- [Logging](https://github.com/mozautomation/mozmill/blob/master/mozmill/mozmill/logger.py) :
  log results to stdout or a file in a [format appropriate to Mozilla tests](https://developer.mozilla.org/en/Test_log_format)
- [Report](https://github.com/mozautomation/mozmill/blob/master/mozmill/mozmill/report.py) :
  generate a JSON report of the run
- [PythonCallbacks](https://github.com/mozautomation/mozmill/blob/master/mozmill/mozmill/python_callbacks.py) :
  call a python module and method from JavaScript

When running from the command line, these are on by default.  However,
you may use the `--disable` command line argument to turn them off:

    mozmill -t foo.js --disable Logging --report stdout 

This command line will dump the JSON of the report to stdout.

You can also add free-standing python modules as pluggable event
listeners from the command line using the switch
`--handler=PATH:CLASS`, where `PATH` is the path to the python file
and `CLASS` is the name of the event handler class in the file

As an example, if you want to override the default reporting handler
and replace with your own reporting handler, `NewReport`, in
`myreport.py`, you would invoke mozmill as such:

    mozmill --disable Report --handler myreport.py:NewReport [...]

`NewReport` could conceivably subclass from `mozmill.report:Report` as
desired.


# API Usage

One of the primary motiviations for the restructuring of the command
line handling as well as adding pluggable events is to make writing
APIs around Mozmill easier.  Prior to Mozmill 2.0, it was difficult (a
significant chunk of code needed to be replicated, which of course
relies on innards not changing to be maintainable) to invoke MozMill
programmatically at all and impossible to extend it in many ways.

The `mozmill.CLI` command line controller inserts the (global) handlers as
designated by the `mozmill.event_handlers` entry point (unless
disabled with the `--disable` flag) as well as any classes designated
via `--handler PATH:CLASS` when constructing a `MozMill` object.

When instantiating `MozMill` as an API, you must instantiate
and pass in the handlers that you want to use.

You can also call `MozMill.add_listener(...)` or 
`MozMill.add_global_listener(...)` following object construction.


# Structure of an Event Handler

The basic methods for an event handler is given and documented in
[mozmill.handlers.EventHandler](https://github.com/mozautomation/mozmill/blob/master/mozmill/mozmill/handlers.py).  
While this class is never inherited from, it shows the basic methods that event handlers can
have and documentation on what they are used for.

The `add_options` method is used to add options to the command line
parser.

In order to be utilized from the command line, the handler should have
a constructor.  A blank one is fine.  The attribute names for the
constructor signature should match those in `add_options` if you
wished them to be controllable from the command line.

If an event handler is callable, then all events and their event types
will be passed to the `__call__` method.  It is a global event handler.

The event handler should have an `events` method.  This should
return a dict of names of events to listen for mapped to the methods
that listen to these events.

Currently the event type is a convention-based string.  There
is no catalog of events to be listened for.  A list of applicable
events should be maintained as well as when each is called by the
tests.  It would be even better if this was programmatic.

If the event handler has a `stop()` method, this is called at the
end of the test run internally to python (no JS communication is done
here).  Whether the stop is fatal or not (something bad has happened,
e.g. an exception) is passed in.  This gives event handlers the
opportunity to output final statistics and otherwise do cleanup.


## Command Line Arguments

Event handlers may add arguments via an `add_options` class method to
which the parser is passed (see: `mozmill.CLI.add_options`).
When driving via the command line, the handlers are instantiated with
the passed-in options.  `mozmill.handlers.instantiate_handler`
introspects the passed in handler to determine which command line
options are needed and constructs the object based on this
information (it is a handler-factory).  If the handler raises a
`mozmill.handlers.HandlerMatchException` the handler is not
instantiated or passed to the MozMill constructor.

As an example, see the constructor of 
[mozmill.report.Report](https://github.com/mozautomation/mozmill/blob/master/mozmill/mozmill/report.py).  
If `report` is `None`, as it would be if not specified via the command
line (see the class's `add_options` method for `--report`), then
the class is not instantiated or utilized.
