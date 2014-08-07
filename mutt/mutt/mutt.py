# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, you can obtain one at http://mozilla.org/MPL/2.0/.

import imp
import mozmill
import optparse
import os
import re
import sys
import traceback
import unittest

from manifestparser import TestManifest
from mozmill.logger import LoggerListener


usage = """
%prog [options] command [command-specific options]

Mozmill Unit Test Tester : test the test harness!

Commands:
  testjs     - run mozmill js tests
  testpy     - run mozmill python tests
  testall    - test whole environment
"""

global_options = [
    (("-b", "--binary"),
     dict(dest="binary",
          help="Path to application binary",
         )),
    (("-m", "--manifest"),
     dict(dest="manifest",
          default=os.path.join(os.path.dirname(__file__),
                               "tests", "manifest.ini"),
          help="Use a specific manifest rather than %default")),
    (("-v", "--verbose"),
     dict(dest="verbose",
          default=False,
          action="store_true",
          help="Enable detailed output")),
    (("-r", "--restart"),
     dict(dest="restart",
          default=False,
          action="store_true",
          help="Isolation mode (restart between each Mozmill test)")),
    (("-a", "--app"),
     dict(dest="app",
          default='firefox',
          help="Application to use [default: %default]"))
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
        parser.error("Invalid command: '%s' (Should be one of: %s)" %
                     (args[0], ', '.join(commands)))
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
            # If the test module is skipped in the manifest, ensure that any test is also marked as skipped
            if 'disabled' in t:
                for individual_test in test:
                    setattr(individual_test, 'setUp', lambda: individual_test.skipTest(t.get('disabled')))
            unittests.append(test)
    return unittests


def report(pyresults=None, jsresults=None, options=None):
    fail_total = 0
    skipped_total = 0
    test_total = 0

    # Print the failures

    print "=" * 75
    if pyresults:
        test_total += pyresults.testsRun
        skipped_total += len(pyresults.skipped)

        if pyresults.failures or pyresults.errors:
            print "Python Failures:"
            fail_total += len(pyresults.failures) + len(pyresults.errors)
            for failure in pyresults.failures:
                print "%s\n" % str(failure)
            for failure in pyresults.errors:
                print "%s\n" % str(failure)
    else:
        print "No Python Failures"

    print "\n", "=" * 75
    if jsresults:
        test_total += len(jsresults.alltests)
        skipped_total += len(jsresults.skipped)
        if jsresults.fails:
            print "Javascript Failures:"
            fail_total += len(jsresults.fails)
            for module in jsresults.fails:
                for failure in module["fails"]:
                    if 'exception' in failure:
                        info = failure['exception']
                        print 'Exception: "%s" (%s)' % (info.get('message'),
                                                        module.get('filename'))
                    elif 'fail' in failure:
                        info = failure['fail']
                        print 'Failure: "%s" (%s)' % (info.get('message'),
                                                      module.get('filename'))
                    else:
                        print 'Failure: %s' % failure.get('message', failure)

    else:
        print "No Javascript Failures"

    print "\nTotal passed: %d" % (test_total - fail_total - skipped_total)
    print "Total failed: %d" % fail_total
    print "Total skipped: %d" % skipped_total

    return int(fail_total > 0)


def test_all(tests, options):

    pytests = [item for item in tests if item['type'] == 'python']
    jstests = [item for item in tests if item['type'] == 'javascript']

    try:
        pyresult = test_all_python(pytests, options)
    except SystemExit as e:
        fail = (e.code != 0) or fail

    try:
        jsresult = test_all_js(jstests, options)
    except SystemExit as e:
        fail = (e.code != 0) or fail

    # XXX unify this with main function below
    # return the value vs. exiting here
    sys.exit(report(pyresult, jsresult, options))


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

    # Create logger for console
    level = "DEBUG" if options.verbose else "INFO"
    logger = LoggerListener(console_level=level)

    m = mozmill.MozMill.create(handlers=[logger], app=options.app)
    try:
        m.run(tests, options.restart)
    except:
        exception_type, exception, tb = sys.exc_info()
        traceback.print_exception(exception_type, exception, tb)

    return m.finish()


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
        tests = mp.active_tests(disabled=True)
        results = test_all_python(mp.get(tests=tests, type='python'), options)
        sys.exit(report(results, None, options))

    elif command == "testjs":
        tests = mp.active_tests(disabled=True)
        results = test_all_js(mp.get(tests=tests, type='javascript'), options)
        sys.exit(report(None, results, options))

    elif command == "testall":
        test_all(mp.active_tests(disabled=True), options)


if __name__ == '__main__':
    run()
