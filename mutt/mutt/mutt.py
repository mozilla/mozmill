# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this file,
# You can obtain one at http://mozilla.org/MPL/2.0/.

import sys
import os
import re
import optparse
import imp
import tempfile
import unittest

from manifestparser import TestManifest
from mozprocess import ProcessHandler

usage = """
%prog [options] command [command-specific options]

Mozmill Unit Test Tester : test the test harness!

Commands:
  testjs     - run mozmill js tests
  testpy     - run mozmill python tests
  testall    - test whole environment
"""

global_options = [
    (("-v", "--verbose",), dict(dest="verbose",
                                help="enable lots of output",
                                action="store_true",
                                default=False)),
    (("-b", "--binary",), dict(dest="binary",
                               help="path to app binary",
                               metavar=None,
                               default=None,)),
    (("-m", "--manifest",), dict(dest="manifest",
                                 help="use a specific manifest rather than the default all-tests.ini",
                                 metavar=None,
                                 default=os.path.join(os.path.dirname(__file__), "tests", "all-tests.ini"))),
    ]

# Maximum time we'll wait for tests to finish, in seconds.
TEST_RUN_TIMEOUT = 5 * 60

def parse_args(arguments):

    # create a parser
    parser = optparse.OptionParser(usage=usage.strip())

    # sort the options so that they print in a nice order
    def name_cmp(option):
        return option[0][-1].lstrip('-')
    global_options.sort(key=name_cmp)

    # add the options
    for names, opts in global_options:
        parser.add_option(*names, **opts)

    (options, args) = parser.parse_args(args=arguments)

    # args[0] == command
    if not len(args):
        return (options, 'testall')
    if len(args) != 1:
        parser.print_help()
        parser.exit()
    commands = ('testall', 'testpy', 'testjs')
    if args[0] not in commands:
        parser.error("Invalid command: '%s' (Should be one of: %s)" % (args[0], ', '.join(commands)))
    return (options, args[0])

def get_pytests(testdict):
    unittests = []
    for t in testdict:
        path = t['path']
        assert os.path.exists(path)
        modname = os.path.splitext(os.path.basename(path))[0]
        module = imp.load_source(modname, path)
        loader = unittest.TestLoader()
        suite = loader.loadTestsFromModule(module)
        for test in suite:
            unittests.append(test)
    return unittests

def report(fail, pyresults=None, jsresults=None, options=None):
    if not fail:
        print "All tests were successful.  Ship it!"
        return 0

    # Print the failures
    print "Some tests were unsuccessful."
    print "+" * 75
    if pyresults:
        print "Python Failures:"
        for i in pyresults.failures:
            print "%s\n" % str(i)
        for i in pyresults.errors:
            print "%s\n" % str(i)
    else:
        print "No Python Failures"
    print "=" * 75
    if jsresults:
        print "Javascript Failures:"
        for i in jsresults.failures:
            print "%s\n" % str(i)
    else:
        print "No Javascript Failures"

    return 1

def test_all(tests, options):
    fail = False

    pytests = [item for item in tests if item['type'] == 'python']
    jstests = [item for item in tests if item['type'] == 'javascript']

    try:
        pyresult = test_all_python(pytests, options)
        if pyresult.failures or pyresult.errors:
            fail = True
    except SystemExit, e:
        fail = (e.code != 0) or fail

    try:
        jsresult = test_all_js(jstests, options)
        if jsresult.failures:
            fail = True
    except SystemExit, e:
        fail = (e.code != 0) or fail

    # XXX unify this with main function below
    # return the value vs. exiting here
    sys.exit(report(fail, pyresult, jsresult, options))

def test_all_python(tests, options):
    print "Running python tests"
    unittestlist = get_pytests(tests)
    verbosity = 1
    if options.verbose:
        verbosity = 2
    suite = unittest.TestSuite(unittestlist)
    runner = unittest.TextTestRunner(verbosity=verbosity)
    return runner.run(suite)

def test_all_js(tests, options):
    print "Running JS Tests"
    # We run each test in its own instance since these are harness tests.
    # That just seems safer, no opportunity for cross-talk since
    # we are sorta using the framework to test itself
    results = JSResults()

    for t in tests:

        # write a temporary manifest
        manifest = TestManifest()
        manifest.tests = [t]
        fd, filename = tempfile.mkstemp(suffix='.ini')
        os.close(fd)
        fp = file(filename, 'w')
        manifest.write(fp=fp)
        fp.close()

        # get CLI arguments to mozmill
        args = ['-b', options.binary]
        args.append('--console-level=DEBUG')
        args.append('--format=pprint-color')
        args.append('-m')
        args.append(filename)

        # run the test
        proc = ProcessHandler("mozmill", args=args)
        proc.run()
        status = proc.waitForFinish(timeout=300)
        command = proc.commandline
        results.acquire(t['name'], proc.output, status, command)

        # remove the temporary manifest
        os.remove(filename)
        
    return results

class JSResults(object):
    """
    Takes in a standard output log and marshals it into our
    class in an additive fashion.
    TODO: This needs some work.  My thought is to go through what we
    get back from the test, analyze each line, add the passes to the pass list
    add the failures to the fail list, and the rest to the info list.

    But I'm thinking this really needs to be swapped out for a real log parser
    """

    def __init__(self):
        self.failures = []
        self.passes = []
        self.info = []
        self.text = {}

    def acquire(self, testname, buf, status, command):

        # record failures based on exit status
        if status:
            self.failures.append("Exit %s: %s" % (status, command))

        # scan test log for magical tokens
        # see also: http://hg.mozilla.org/automation/logparser/
        passre = re.compile("^TEST-(PASS|EXPECTED-FAIL).*")
        failre = re.compile("^TEST-UNEXPECTED-.*")
        tback = re.compile("^Traceback.*")
        excpt = re.compile("^Exception:.*")

        self.text[testname] = []

        for line in buf:
            print line
            if passre.match(line):
                self.passes.append(line)
            elif failre.match(line):
                self.failures.append(line)
            elif tback.match(line):
                self.failures.append(line)
            elif excpt.match(line):
                self.failures.append(line)
            else:
                self.info.append(line)
            self.text[testname].append(line)

def run(arguments=sys.argv[1:]):

    # parse the command line arguments
    (options, command) = parse_args(arguments)

    # ensure the binary is given
    if not options.binary:
        print "Please provide a path to your Firefox binary: -b, --binary"
        sys.exit(1)

    # set the BROWSER_PATH environment variable so that
    # subshells will be able to invoke mozrunner
    os.environ['BROWSER_PATH'] = options.binary

    # Parse the manifest
    mp = TestManifest(manifests=(options.manifest,), strict=False)

    # run + report
    if command == "testpy":
        results = test_all_python(mp.get(tests=mp.active_tests(disabled=False), type='python'), options)
        if results.failures or results.errors:
            sys.exit(report(True, results, None, options))
        else:
            sys.exit(report(False))

    elif command == "testjs":
        results = test_all_js(mp.get(tests=mp.active_tests(disabled=False), type='javascript'), options)
        if results.failures:
            sys.exit(report(True, None, results, options))
        else:
            sys.exit(report(False))

    elif command == "testall":
        test_all(mp.active_tests(disabled=False), options)


if __name__ == '__main__':
    run()
