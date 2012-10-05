Python Mozmill is a test harness and an [event dispatcher](/en/Mozmill/EventHandlers).
Mozmill is built as an [extension](https://github.com/mozautomation/mozmill/tree/master/mozmill/mozmill/extension)
which, paired with the 
[jsbridge extension](https://github.com/mozautomation/mozmill/tree/master/jsbridge/jsbridge/extension),
can run JavaScript tests from the python harness.


# Components

The Mozmill python package is built from a number of python dependencies:

- [jsbridge](/en/Mozmill/jsbridge) : python to JavaScript bridge interface
- [mozrunner](/en/Mozrunner) : Reliable start/stop/configuration of Mozilla Applications (Firefox, Thunderbird, etc.)
- [mozinfo](/en/Mozinfo) : unified Mozilla interface to system information
- [manifestparser](http://hg.mozilla.org/automation/ManifestDestiny) : parses test and addon manifests


# TestResults Class

The 
[TestResults class](https://github.com/mozautomation/mozmill/blob/master/mozmill/mozmill/__init__.py)
is used to accumulate results from one or more `MozMill` test run.
The passing, failed, and skipped tests are recorded.  `TestResults` is
an [event handler](/en/Mozmill/EventHandlers) that listens to the
`mozmill.endTest` event to accumulate results. Additionally, since
`TestResults` is persisted across test runs, it is the appropriate
place to handle the post-run `stop()` method of 
[event handlers](EventHandlers).  Call `TestResults.finish()` with the
handlers which have `stop()` methods following the run.
You may pass a `TestResults` instance to the `MozMill` constructor, or
`MozMill.__init__` will create one for you.  The `TestResults`
instance is returned from `MozMill.run(...)`. 


# Command line arguments and inheritence

The mozmill command line controller,
[mozmill.CLI](https://github.com/mozautomation/mozmill/blob/master/mozmill/mozmill/__init__.py),
inherits from [mozrunner.CLI](https://github.com/mozautomation/mozmill/blob/master/mozrunner/mozrunner/runner.py)
which provides the appropriate slots for instantiating a `Runner`
object appropriate to the application under test (e.g. `FirefoxRunner`).
Additionally, `mozrunner.CLI` consumes and exposes the arguments from
[MozProfileCLI](https://github.com/mozautomation/mozmill/blob/master/mozprofile/mozprofile/cli.py) .
This architecture allows mozrunner and mozprofile to exist as
independent command line programs while making their breadth of options
available upstream to mozmill.


# Factory methods

In order to be usable as an API, 
[MozMill](https://github.com/mozautomation/mozmill/blob/master/mozmill/mozmill/__init__.py)
and
[mozrunner.Runner](https://github.com/mozautomation/mozmill/blob/master/mozrunner/mozrunner/runner.py)
expose a class method, `create(...)`, which provides for the
instantiation of the corresponding object.  Since `MozMill` requires
the runner to be passed in to its constructor (`__init__` function)
and the `Runner` requires the [profile](/en/Mozprofile) to be passed
in to its constructor, the `create()` factory methods enable the
construction of these objects in a cascading fashion with arbitrary
parameters without compromising the control flow or flexibility of the
API of the underlying objects.

