import sys
import os
import re
import optparse
import imp
import unittest

from copy import copy
from manifestparser import ManifestParser 
from processhandler import ProcessHandler

usage = """
%prog [options] command [command-specific options]

Supported Commands:
  test       - run tests

Internal Commands:
  testcfx    - test the cfx tool
  testjs     - run mozmill js tests
  testpy     - run mozmill python tests
  testall    - test whole environment

Experimental and internal commands and options are not supported and may be
changed or removed in the future.
"""

global_options = [
    (("-v", "--verbose",), dict(dest="verbose",
                                help="enable lots of output",
                                action="store_true",
                                default=False)),
    ]

parser_groups = (
    ("Supported Command-Specific Options", [
        (("-p", "--profiledir",), dict(dest="profiledir",
                                       help=("profile directory to pass to "
                                             "app"),
                                       metavar=None,
                                       default=None,
                                       cmds=['test', 'testjs', 
                                             'testpy', 'testall'])),
        (("-b", "--binary",), dict(dest="binary",
                                   help="path to app binary",
                                   metavar=None,
                                   default=None,
                                   cmds=['test', 'testjs', 'testpy',
                                         'testall'])),
        (("-a", "--app",), dict(dest="app",
                                help=("app to run: firefox (default), "
                                      "xulrunner, fennec, or thunderbird"),
                                metavar=None,
                                default="firefox",
                                cmds=['test', 'testjs', 'testpy',
                                      'testall'])),
        (("", "--times",), dict(dest="iterations",
                                type="int",
                                help="number of times to run tests",
                                default=1,
                                cmds=['test', 'testjs', 'testpy',
                                      'testall'])),
        (("-f", "--filter",), dict(dest="filter",
                                   help=("only run tests whose filenames "
                                         "match FILTER, a regexp"),
                                   metavar=None,
                                   default=None,
                                   cmds=['test', 'testjs', 'testpy',
                                         'testall'])),
        (("-m", "--manifest",), dict(dest="manifest",
                                       help=("use a specific manifest rather than the "
                                             "default all-tests.ini"),
                                       metavar=None,
                                       default="all-tests.ini",
                                       cmds=['test', 'testjs',
                                             'testpy', 'testall'])),
        (("", "--extra-packages",), dict(dest="extra_packages",
                                         help=("extra packages to include, "
                                               "comma-separated. Default is "
                                               "'none'."),
                                         metavar=None,
                                         default=None,
                                         cmds=['test', 'testjs',
                                               'testpy', 'testall',
                                               'testcfx'])),
        ]
     ),


    ("Internal Command-Specific Options", [
        (("", "--addons",), dict(dest="addons",
                                 help=("paths of addons to install, "
                                       "comma-separated"),
                                 metavar=None,
                                 default=None,
                                 cmds=['test', 'run', 'testjs', 'testpy',
                                       'testall'])),
        (("", "--test-runner-pkg",), dict(dest="test_runner_pkg",
                                          help=("name of package "
                                                "containing test runner "
                                                "program (default is "
                                                "test-harness)"),
                                          default="test-harness",
                                          cmds=['test', 'testjs', 'testpy',
                                                'testall'])),
        (("", "--e10s",), dict(dest="enable_e10s",
                               help="enable out-of-process Jetpacks",
                               action="store_true",
                               default=False,
                               cmds=['test', 'testjs', 'testpy', 'testall'])),
        (("", "--logfile",), dict(dest="logfile",
                                  help="log console output to file",
                                  metavar=None,
                                  default=None,
                                  cmds=['test', 'testjs', 'testpy', 'testall'])),
        # TODO: This should default to true once our memory debugging
        # issues are resolved; see bug 592774.
        (("", "--profile-memory",), dict(dest="profileMemory",
                                         help=("profile memory usage "
                                               "(default is false)"),
                                         type="int",
                                         action="store",
                                         default=0,
                                         cmds=['test', 'testjs', 'testpy',
                                               'testall'])),
        ]
     ),
    )

# Maximum time we'll wait for tests to finish, in seconds.
TEST_RUN_TIMEOUT = 5 * 60

def find_parent_package(cur_dir):
    tail = True
    while tail:
        if os.path.exists(os.path.join(cur_dir, 'package.json')):
            return cur_dir
        cur_dir, tail = os.path.split(cur_dir)
    return None

def check_json(option, opt, value):
    # We return the parsed JSON here; see bug 610816 for background on why.
    try:
        return json.loads(value)
    except ValueError:
        raise optparse.OptionValueError("Option %s must be JSON." % opt)

class CfxOption(optparse.Option):
    TYPES = optparse.Option.TYPES + ('json',)
    TYPE_CHECKER = copy(optparse.Option.TYPE_CHECKER)
    TYPE_CHECKER['json'] = check_json

def parse_args(arguments, global_options, usage, parser_groups, defaults=None):
    parser = optparse.OptionParser(usage=usage.strip(), option_class=CfxOption)

    def name_cmp(a, b):
        # a[0]    = name sequence
        # a[0][0] = short name (possibly empty string)
        # a[0][1] = long name
        names = []
        for seq in (a, b):
            names.append(seq[0][0][1:] if seq[0][0] else seq[0][1][2:])
        return cmp(*names)

    global_options.sort(name_cmp)
    for names, opts in global_options:
        parser.add_option(*names, **opts)

    for group_name, options in parser_groups:
        group = optparse.OptionGroup(parser, group_name)
        options.sort(name_cmp)
        for names, opts in options:
            if 'cmds' in opts:
                cmds = opts['cmds']
                del opts['cmds']
                cmds.sort()
                if not 'help' in opts:
                    opts['help'] = ""
                opts['help'] += " (%s)" % ", ".join(cmds)
            group.add_option(*names, **opts)
        parser.add_option_group(group)

    if defaults:
        parser.set_defaults(**defaults)

    (options, args) = parser.parse_args(args=arguments)

    if not args:
        parser.print_help()
        parser.exit()

    return (options, args)

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

def report(fail, pyresults = None, jsresults = None, options = None):
    if not fail:
        print "All tests were successful.  Ship it!"
        return 0

    # Print the failures
    print "Some tests were unsuccessful."
    print "++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++"
    if (pyresults):
        print "Python Failures:"
        for i in pyresults.failures:
            print "%s\n" % str(i)
        for i in pyresults.errors:
            print "%s\n" % str(i)
    else:
        print "No Python Failures"

    print "=========================================================================="
    if (jsresults):
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

    sys.exit(report(fail, pyresult, jsresult, options))

def test_all_python(tests, options):
    print "Running python tests" 
    unittestlist = get_pytests(tests)
    verbosity = 1
    if (options.verbose):
        verbosity = 2
    suite = unittest.TestSuite(unittestlist)
    runner = unittest.TextTestRunner(verbosity=verbosity)
    return runner.run(suite)

def test_all_js(tests, options):
    print "Running JS Tests"
    # We run each test in its own instance since these are harness tests
    # That just seems safer, no opportunity for cross-talk since
    # We are sorta using the framework to test itself
    results = JSResults()
    for t in tests:
        args = []
        if 'restart' in t:
            args.append('--restart')
        if options.binary:
            args.append('-b')
            args.append(options.binary)
        args.append('--show-all')
        
        args.append('-t')
        args.append(t['path'])
        
        proc = ProcessHandler("mozmill", args, os.getcwd())
        proc.run()
        status = proc.waitForFinish(timeout=300)
        results.acquire(t['name'], proc.output)
    return results

class JSResults:
    def __init__(self):
        self.failures = []
        self.passes = []
        self.info = []
        self.text = {}
  
    """
    Takes in a standard output log and marshals it into our
    class in an additive fashion.
    TODO: This needs some work.  My thought is to go through what we 
    get back from the test, analyze each line, add the passes to the pass list
    add the failures to the fail list, and the rest to the info list.

    But I'm thinking this really needs to be swapped out for a real log parser
    """
    def acquire(self, testname, buf):
        passre = re.compile("^TEST-PASS.*")
        failre = re.compile("^TEST-UNEXPECTED-FAIL.*")
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
                

def run(arguments=sys.argv[1:], target_cfg=None, pkg_cfg=None,
        defaults=None):
    parser_kwargs = dict(arguments=arguments,
                         global_options=global_options,
                         parser_groups=parser_groups,
                         usage=usage,
                         defaults=defaults)

    (options, args) = parse_args(**parser_kwargs)

    command = args[0]

    # Parse the manifests
    mp = ManifestParser()
    mp.read(options.manifest)

    if command == "testpy":
        results = test_all_python(mp.get(type='python'), options)
        if results.failures or results.errors:
            sys.exit(report(True, results, None, options))
        else:
            sys.exit(report(False))


    elif command == "testjs":
        results = test_all_js(mp.get(type='javascript'), options)
        if results.failures:
            sys.exit(report(True, None, results, options))
        else:
            sys.exit(report(False))
  
    elif command == "testall":
        test_all(mp.tests, options)
        return
    else:
        print "Unknown command"
        sys.exit(1)

if __name__ == '__main__':
    run()

