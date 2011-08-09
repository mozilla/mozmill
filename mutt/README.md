# mutt

Test harness for testing [Mozmill](https://developer.mozilla.org/en/Mozmill).
mutt is a python package that contains both JavaScript and python tests for
Mozmill and other packages in the 
[mozmill repository](http://github.com/mozautomation/mozmill) .


## Usage

Running `mutt --help` will give usage information.  In short, running
`mutt` with no arguments or `mutt testall` will run both the python
and JavaScript tests, running `mutt testjs` will run only the JavaScript
tests, and running `mutt testpy` will run only the python tests.

These arguments correspond to the following manifests:

- testall : all-tests.ini
- testpy : pythontests.ini
- testjs : jstests.ini


## About the tests

In general, tests should be good usage examples.  Try to write a test
that illustrates an issue!  While sometimes this is not possible, it
is a good aspiration to live by.

The manifests use the
[manifestparser](http://hg.mozilla.org/automation/ManifestDestiny)
format.


## Policy

Run the tests *before* pushing to master or any branch of
[mozautomation](http://github.com/mozautomation/mozmill) . What is
lost in time here is more than made up for vs. hours of regression hunting.

The mutt tests should pass *all* the time on *all* platforms of
interest!  If this is not the case, there is a problem.  If a test
fails, does it fail without your changes?  

In either case, the following actions are advised:

- if you can, fix the test case. Please. jhammel will personally buy
  you a beverage of choice

- hop on `#mozmill` on irc://irc.mozilla.org/ and mention what you
  observe

- mail the `mozmill-dev` group

- if the failure is not caused by your changes, file a bug detailing
  what you're observing

- if the test cannot be fixed immediately but should not be deprecated
  (so, the last case resort), remove the test from the appropriate
  test manifest.  Note this in the bug.  It is a higher value (at
  least for now) to have 100% passing tests than to have higher test coverage.
