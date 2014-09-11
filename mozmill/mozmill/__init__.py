# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, you can obtain one at http://mozilla.org/MPL/2.0/.

import copy
from datetime import datetime
import handlers
import json
from optparse import OptionGroup
import os
import socket
import sys
import tempfile
from time import sleep
import traceback

from manifestparser import TestManifest
import mozinfo
import mozrunner
from mozrunner.utils import get_metadata_from_egg
import wptserve

import jsbridge
from .errors import *

# metadata
package_metadata = get_metadata_from_egg('mozmill')

js_module_template = 'Components.utils.import("resource://mozmill/%s")'
js_module_frame = js_module_template % 'modules/frame.js'
js_module_mozmill = js_module_template % 'driver/mozmill.js'

basedir = os.path.abspath(os.path.dirname(__file__))
extension_path = os.path.join(basedir, 'extension')

# defaults
ADDONS = [extension_path, jsbridge.extension_path]
JSBRIDGE_TIMEOUT = 60.

# Environment variables
ENVIRONMENT = {
    # Disable the internal crash reporter
    'MOZ_CRASHREPORTER_NO_REPORT': '1',
}


class TestResults(object):
    """Class to accumulate test results and other information."""

    def __init__(self):
        # application information
        self.appinfo = {}

        # other information
        self.mozmill_version = package_metadata.get('Version')
        self.screenshots = []

        # test statistics
        self.alltests = []
        self.fails = []
        self.passes = []
        self.skipped = []

        # total test run time
        self.starttime = datetime.utcnow()
        self.endtime = None

    def events(self):
        """Events, the MozMill class will dispatch to."""
        return {'mozmill.endTest': self.endTest_listener}

    ### event listener
    def endTest_listener(self, test):
        """Add current test result to results."""
        self.alltests.append(test)
        if test.get('skipped', False):
            self.skipped.append(test)
        elif test['failed'] > 0:
            if self.mozmill.running_test.get('expected') == 'fail':
                self.passes.append(test)
            else:
                self.fails.append(test)
        else:
            if self.mozmill.running_test.get('expected') == 'fail':
                self.fails.append(test)
            else:
                self.passes.append(test)


class MozMill(object):
    """MozMill is a test runner.

    You should use MozMill as follows:

        m = MozMill(...)
        m.run(tests)
        m.run(other_tests)
        results = m.finish()
    """

    @classmethod
    def create(cls, jsbridge_timeout=JSBRIDGE_TIMEOUT,
               handlers=None, app='firefox', profile_args=None,
               runner_args=None, screenshots_path=None, server_root=None):

        jsbridge_port = jsbridge.find_port()

        # select runner and profile class for the given app
        try:
            runner_class = mozrunner.runners[app]
        except KeyError:
            msg = 'Application "%s" unknown (should be one of %s)'
            raise NotImplementedError(msg % (app, mozrunner.runners.keys()))

        # get the necessary arguments to construct the profile and
        # runner instance
        profile_args = copy.deepcopy(profile_args) or {}
        profile_args.setdefault('addons', []).extend(ADDONS)

        preferences = profile_args.setdefault('preferences', {})
        if isinstance(preferences, dict):
            # Bug 695026 - Re-enable e10s when fully supported
            preferences['browser.tabs.remote'] = False
            preferences['browser.tabs.autostart'] = False
            preferences['browser.displayedE10SPrompt'] = 5

            preferences['extensions.jsbridge.port'] = jsbridge_port
            preferences['focusmanager.testmode'] = True
        elif isinstance(preferences, list):
            # Bug 695026 - Re-enable e10s when fully supported
            preferences.append(('browser.tabs.remote', False))
            preferences.append(('browser.tabs.autostart', False))
            preferences.append(('browser.displayedE10SPrompt', 5))

            preferences.append(('extensions.jsbridge.port', jsbridge_port))
            preferences.append(('focusmanager.testmode', True))
        else:
            raise Exception('Invalid type for preferences in profile_args')

        runner_args = copy.deepcopy(runner_args) or {}
        runner_args['profile_args'] = profile_args

        # update environment variables for API usage
        os.environ.update(ENVIRONMENT)

        # create an equipped runner
        runner = runner_class.create(**runner_args)

        # create a mozmill
        return cls(runner, jsbridge_port, jsbridge_timeout=jsbridge_timeout,
                   handlers=handlers, screenshots_path=screenshots_path,
                   server_root=server_root)

    def __init__(self, runner, jsbridge_port,
                 jsbridge_timeout=JSBRIDGE_TIMEOUT, handlers=None,
                 screenshots_path=None, server_root=None):
        """Constructor of the Mozmill class.

        Arguments:
        runner -- The MozRunner instance to run the application
        jsbridge_port -- The port the jsbridge server is running on

        Keyword arguments:
        jsbridge_timeout -- How long to wait without a jsbridge communication
        handlers -- pluggable event handlers
        screenshots_path -- Path where screenshots will be saved
        server_root -- Path where to serve testcase files from

        """
        # the MozRunner
        self.runner = runner

        self.server_root = server_root
        self.http_server_start()

        # execution parameters
        self.debugger = None
        self.interactive = False

        # jsbridge parameters
        self.jsbridge_port = jsbridge_port
        self.jsbridge_timeout = jsbridge_timeout
        self.bridge = self.back_channel = None

        # Report data will end up here
        self.results = TestResults()

        # persisted data
        self.persisted = {}

        # state parameters
        self.endRunnerCalled = False
        self.running_test = {}
        self.shutdownMode = {}

        # crash handling parameters
        self.minidump_save_path = tempfile.gettempdir()

        # list of listeners and handlers
        self.listeners = []
        self.listener_dict = {}  # by event type
        self.global_listeners = []
        self.handlers = []

        # screenshots data
        self.persisted['screenshots'] = {}
        if screenshots_path:
            path = os.path.abspath(screenshots_path)
            if not os.path.isdir(path):
                os.makedirs(path)
        self.persisted['screenshots']['path'] = screenshots_path or tempfile.mkdtemp()

        # setup event handlers and register listeners
        self.setup_listeners()

        handlers = handlers or list()
        handlers.append(self.results)
        self.setup_handlers(handlers)


    ### methods for event listeners

    def setup_handlers(self, handlers):
        for handler in handlers:
            self.handlers.append(handler)

            # make the mozmill instance available to the handler
            handler.mozmill = self

            if hasattr(handler, 'events'):
                for event, method in handler.events().items():
                    self.add_listener(method, eventType=event)
            if hasattr(handler, '__call__'):
                self.add_global_listener(handler)

    def setup_listeners(self):
        self.add_listener(self.endRunner_listener,
                          eventType='mozmill.endRunner')
        self.add_listener(self.frameworkFail_listener,
                          eventType='mozmill.frameworkFail')
        self.add_listener(self.persist_listener,
                          eventType="mozmill.persist")
        self.add_listener(self.screenshot_listener,
                          eventType='mozmill.screenshot')
        self.add_listener(self.startTest_listener,
                          eventType='mozmill.setTest')
        self.add_listener(self.shutdown_listener,
                          eventType='mozmill.shutdown')

    def add_listener(self, callback, eventType):
        self.listener_dict.setdefault(eventType, []).append(callback)
        self.listeners.append((callback, {'eventType': eventType}))

    def add_global_listener(self, callback):
        self.global_listeners.append(callback)

    def persist_listener(self, obj):
        self.persisted = obj

    def startTest_listener(self, test):
        self.current_test = test

    def frameworkFail_listener(self, obj):
        self.framework_failure = obj['message']

    def endRunner_listener(self, obj):
        self.endRunnerCalled = True

    def shutdown_listener(self, obj):
        """Listener for shutdown events.

        Listen for the 'shutdown' event and set some state so
        that the (Python) instance knows what to do.

        Arguments:
        obj -- Information about the user shutdown event. It contains the keys:
                restart -- whether the application is to be restarted
                user -- whether the shutdown was triggered via test JS
                next -- for the restart cases, which test to run next
                resetProfile -- reset the profile after shutdown

        """
        self.shutdownMode = obj

    def screenshot_listener(self, obj):
        self.results.screenshots.append(obj)

    def fire_event(self, event, obj):
        """Fire an event from the python side."""

        # namespace the event
        event = 'mozmill.' + event

        # global listeners
        for callback in self.global_listeners:
            callback(event, obj)

        # event listeners
        for callback in self.listener_dict.get(event, []):
            callback(obj)

    ### methods for startup

    def create_network(self):

        # get the bridge and the back-channel
        self.back_channel, \
        self.bridge = jsbridge.wait_and_create_network("127.0.0.1",
                                                       self.jsbridge_port,
                                                       self.jsbridge_timeout)
        # set a timeout on jsbridge actions in order to ensure termination
        self.back_channel.timeout = self.bridge.timeout = self.jsbridge_timeout

        # Assign listeners to the back channel
        for listener in self.listeners:
            self.back_channel.add_listener(listener[0], **listener[1])
        for global_listener in self.global_listeners:
            self.back_channel.add_global_listener(global_listener)

    def set_debugger(self, debugger_args=None, interactive=True):
        """Sets arguments for the debugger attached to the application.

        Keyword arguments:
        debugger_args --- Command line arguments to the debugger
                          (None disables the debugger)
        interactive -- whether to run in interactive mode

        """
        self.debugger = debugger_args
        self.interactive = interactive

    def start_runner(self):
        """Start the MozRunner."""

        # if user restart we don't need to start the browser back up
        if not self.shutdownMode.get('restart', False):
            if self.shutdownMode.get('resetProfile'):
                # reset the profile
                self.runner.reset()

            self.runner.start(debug_args=self.debugger,
                              interactive=self.interactive)

        # set initial states for next test
        self.framework_failure = None
        self.shutdownMode = {}
        self.endRunnerCalled = False

        # create the network
        self.create_network()

        # fetch the application info
        if not self.results.appinfo:
            appinfo = self.get_appinfo()

            self.results.appinfo = appinfo

            # We got the application appdata path. Use it for minidump backups.
            paths = appinfo.get('paths', {})
            if paths:
                self.minidump_save_path = os.path.join(paths['appdata'],
                                                       'Crash Reports',
                                                       'pending')

        try:
            frame = jsbridge.JSObject(self.bridge, js_module_frame)

            # transfer persisted data
            frame.persisted = self.persisted
        except:
            raise

        # return the frame
        return frame

    def run_test_file(self, frame, test, name=None):
        """Run a single test file.

        Arguments:
        frame -- JS frame object
        test -- Test object
        name -- Name of test to run (if None, run all tests)

        """
        try:
            # set the document root
            self.http_server_set_document_root(test)
            frame.runTestFile(test['path'], name)
        except jsbridge.ConnectionError, e:
            # if the runner is restarted via JS, run this test
            # again if the next is specified
            nextTest = self.shutdownMode.get('next')
            if not nextTest:
                # if there is not a next test,
                # throw the error up the chain
                raise

            self.handle_disconnect(e)
            frame = self.run_test_file(self.start_runner(), test, nextTest)

        return frame

    def run(self, tests, restart=False):
        """Run all the tests.

        Arguments:
        tests -- Tests (array) which have to be executed

        Keyword Arguments:
        restart -- If True the application will be restarted between each test

        """
        try:
            frame = None

            # run tests
            tests = list(tests)
            while tests:
                test = tests.pop(0)
                self.running_test = test

                # skip test
                if 'disabled' in test:

                    # see frame.js:events.endTest
                    obj = {'filename': test['path'],
                           'passed': 0,
                           'failed': 0,
                           'passes': [],
                           'fails': [],
                           # Bug 643480
                           # Should be consistent with test.__name__ ;
                           'name': os.path.basename(test['path']),
                           'skipped': True,
                           'skipped_reason': test['disabled']
                    }
                    self.fire_event('endTest', obj)
                    continue

                try:
                    frame = self.run_test_file(frame or self.start_runner(),
                                               test)

                    # If a restart is requested between each test stop the runner
                    # and reset the profile
                    if restart:
                        self.stop_runner()
                        frame = None

                        self.runner.reset()

                except jsbridge.ConnectionError, e:
                    frame = None
                    self.handle_disconnect(e)

            # stop the runner
            if frame:
                self.stop_runner()

        finally:
            # shutdown the test harness cleanly
            self.stop()
            self.running_test = None

    def get_appinfo(self):
        """Collect application specific information."""
        app_info = { }

        try:
            mozmill = jsbridge.JSObject(self.bridge, js_module_mozmill)
            app_info = json.loads(mozmill.getApplicationDetails())
            app_info.update(self.runner.get_repositoryInfo())

        except jsbridge.ConnectionError:
            # We don't have to call report_disconnect here because
            # start_runner() will handle this exception
            pass

        return app_info

    ### methods for shutting down and cleanup

    def finish(self, fatal=False):
        """Do the final reporting and such."""
        self.results.endtime = datetime.utcnow()

        if self.results.screenshots:
            print 'Screenshots saved in %s' % self.persisted['screenshots']['path']

        # handle stop events
        for handler in self.handlers:
            if hasattr(handler, 'stop'):
                handler.stop(self.results, fatal)

            # setup_handlers() sets a reference to the mozmill object.
            # It's not necessary anymore and has to be reset to avoid
            # circular references
            handler.mozmill = None

        self.listeners = []
        self.listener_dict = {}
        self.global_listeners = []
        self.handlers = []

        return self.results

    def check_for_crashes(self):
        """Check if crashes happened while the test was run"""
        return self.runner.check_for_crashes(dump_save_path=self.minidump_save_path,
                                             test_name=self.running_test.get('path'))

    def handle_disconnect(self, e):
        """Handle a ConnectionError for the active process"""
        if not self.shutdownMode:
            # In case of an unexpected disconnect (e.g. crash or restart)
            # give the application some seconds to quit, report the disconnect
            # state, and finally hard-stop the runner
            returncode = self.runner.wait(timeout=5)

            if self.check_for_crashes():
                self.report_disconnect('Application crashed')
            else:
                self.report_disconnect()

            if returncode is None:
                self.stop_runner()
        elif self.shutdownMode.get('restart'):
            # When the application gets restarted it will get a new process id by
            # spawning a new child process and obsoleting the former process.
            # To avoid having zombie processes we have to release the old process
            # by calling wait(). There has to be a timeout so we do not wait forever
            # for the new pid, but the value doesn't matter because we will wait
            # in create_network for a new connection within 60s. There is no need
            # to wait on Windows because the IO completion ports feature is taking
            # care of it internally.
            if not mozinfo.isWin:
                returncode = self.runner.wait(timeout=1)
            else:
                returncode = self.runner.returncode

            # If the application hasn't been restarted (bug 974971) report it
            # as a disconnect error
            if returncode is not None:
                self.stop_runner()
        else:
            # It's a JS triggered shutdown of the application. We
            # have to wait until the process is gone. Otherwise we
            # try to use a profile which is still in use
            self.runner.wait(timeout=self.jsbridge_timeout)

    def report_disconnect(self, message=None):
        if message is None:
            if self.runner.returncode is None:
                message = 'Connection to application lost'
            else:
                message = 'Application unexpectedly closed'

        message += ' (exit code: %s)' % self.runner.returncode

        test = self.running_test
        obj = {'filename': test['path'],
               'passed': 0,
               'failed': 1,
               'passes': [],
               'fails': [{
                   'exception': {
                       'message': message
                   }
               }],
               # Bug 643480
               # Should be consistent with test.__name__ ;
               'name': os.path.basename(test['path'])
        }


        # Ensure that we log this disconnect as failure
        self.results.alltests.append(obj)
        self.results.fails.append(obj)

        self.fire_event('disconnected', message)

    def stop_runner(self):
        # Give a second for any callbacks to finish.
        sleep(1)

        # reset the shutdown mode
        self.shutdownMode = {}

        # quit the application via JS
        # this *will* cause a disconnect error
        # (not sure what the socket.error is all about)
        try:
            frame = jsbridge.JSObject(self.bridge, js_module_frame)
            frame.shutdownApplication()
        except (socket.error, jsbridge.ConnectionError):
            pass

        # wait for the runner to stop
        self.runner.wait(timeout=self.jsbridge_timeout)
        if self.runner.is_running():
            raise errors.ShutdownError('client process shutdown unsuccessful')

    def stop(self):
        """Cleanup after a run"""

        # ensure you have the application info for the case
        # of no tests: https://bugzilla.mozilla.org/show_bug.cgi?id=751866
        # this involves starting and stopping the browser
        if self.results.appinfo is None:
            self.start_runner()
            self.stop_runner()

        # Check for remaining crashes
        if self.check_for_crashes():
            self.report_disconnect('Application crashed')

        # stop the back channel and bridge
        if self.back_channel:
            self.back_channel.close()
            self.bridge.close()

        # stop the http server
        self.http_server_stop()

        # release objects
        self.back_channel = None
        self.bridge = None

        # cleanup
        if self.runner is not None:
            self.runner.cleanup()

    # set document root
    def http_server_set_document_root(self, test):
        # do no set the docroot if it was specified as a cli argument
        # or the current test doesn't have the required variable
        if self.server_root or 'server-root' not in test:
            return

        # Bug 1023790
        # Need to take into account relative paths. Once bug 1023790 lands,
        # all paths will be absolute so remove the else branch
        if os.path.isabs(test['server-root']):
            root = test['server-root']
        else:
            root = os.path.abspath(os.path.join(test['here'],
                                                test['server-root']))
        self.http_server.router.doc_root = root

    # init and start the http server
    def http_server_start(self):
        # start the server
        self.http_server = wptserve.server.WebTestHttpd(doc_root=self.server_root,
                                                        host='localhost',
                                                        port=0)
        self.http_server.start()

        # Add a custom route for POST requests to the default file_handler
        self.http_server.router.register(['POST'], '*', wptserve.handlers.file_handler)

        # expose the URL as a pref
        self.runner.profile.set_persistent_preferences({'extensions.mozmill.baseurl':
                                                        self.http_server.get_url()})

    # stop the http server
    def http_server_stop(self):
        if self.http_server:
            self.http_server.stop()


### method for test collection

def collect_tests(path):
    """Find all tests for a given path."""

    path = os.path.realpath(path)
    if os.path.isfile(path):
        return [path]

    assert os.path.isdir(path), "Not a valid test file or directory: %s" % path
    files = []
    for filename in sorted(os.listdir(path)):
        if filename.startswith("test"):
            full = os.path.join(path, filename)
            if os.path.isdir(full):
                files += collect_tests(full)
            else:
                files.append(full)
    return files


### command line interface

class CLI(mozrunner.CLI):
    """Command line interface to mozmill."""

    module = "mozmill"

    def __init__(self, args):

        # Update environmental settings for command line usage
        os.environ.update(ENVIRONMENT)

        # event handler plugin names
        self.handlers = {}
        for handler_class in handlers.handlers():
            name = getattr(handler_class, 'name', handler_class.__name__)
            self.handlers[name] = handler_class

        self.jsbridge_port = jsbridge.find_port()

        # add and parse options
        mozrunner.CLI.__init__(self, args)

        # Do not allow manifests and tests specified at the same time
        if self.options.manifests and self.options.tests:
            self.parser.error("Options %s and %s are mutually exclusive." %
                              (self.parser.get_option('-t'),
                               self.parser.get_option('-m')))

        # read tests from manifests (if any)
        self.manifest = TestManifest(manifests=self.options.manifests,
                                     strict=False)

        # expand user directory and check existence for the test
        for test in self.options.tests:
            testpath = os.path.expanduser(test)
            realpath = os.path.realpath(testpath)
            if not os.path.exists(testpath):
                raise Exception("Not a valid test file/directory: %s" % test)

            # collect the tests
            def testname(t):
                if os.path.isdir(realpath):
                    return os.path.join(test, os.path.relpath(t, testpath))
                return test
            tests = [{'name': testname(t), 'path': t}
                     for t in collect_tests(testpath)]
            self.manifest.tests.extend(tests)

        # list the tests and exit if specified
        if self.options.list_tests:
            for test in self.manifest.tests:
                print test['path']
            self.parser.exit()

        # instantiate event handler plugins
        self.event_handlers = []
        for name, handler_class in self.handlers.items():
            if name in self.options.disable:
                continue
            handler = handlers.instantiate_handler(handler_class, self.options)
            if handler is not None:
                self.event_handlers.append(handler)
        for handler in self.options.handlers:
            # user handlers
            try:
                handler_class = handlers.load_handler(handler)
            except BaseException as e:
                self.parser.error(str(e))
            _handler = handlers.instantiate_handler(handler_class,
                                                    self.options)
            if _handler is not None:
                self.event_handlers.append(_handler)

        # if in manual mode, ensure we're interactive
        if self.options.manual:
            self.options.interactive = True

    def add_options(self, parser):
        """Add command line options."""

        group = OptionGroup(parser, 'MozRunner options')
        mozrunner.CLI.add_options(self, group)
        parser.add_option_group(group)

        group = OptionGroup(parser, 'MozMill options')
        group.add_option("-t", "--test",
                         dest="tests",
                         default=[],
                         action='append',
                         help='Run test')
        group.add_option("--timeout",
                         dest="timeout",
                         type="float",
                         default=JSBRIDGE_TIMEOUT,
                         help="Seconds before harness timeout if no "
                              "communication is taking place")
        group.add_option("--restart",
                         dest='restart',
                         action='store_true',
                         default=False,
                         help="Restart the application and reset the "
                              "profile between each test file")
        group.add_option("-m", "--manifest",
                         dest='manifests',
                         action='append',
                         metavar='MANIFEST',
                         help='test manifest .ini file')
        group.add_option('-D', '--debug', dest="debug",
                         action="store_true",
                         default=False,
                         help="debug mode"
                         )
        group.add_option('--list-tests',
                         dest='list_tests',
                         action='store_true',
                         default=False,
                         help="List test files that would be run, in order")
        group.add_option('--handler',
                         dest='handlers',
                         action='append',
                         default=[],
                         metavar='PATH:CLASS',
                         help="Specify an event handler given a file PATH "
                              "and the CLASS in the file")
        group.add_option('--screenshots-path',
                         dest='screenshots_path',
                         metavar='PATH',
                         help='Path of directory to use for screenshots')
        group.add_option('--server-root',
                         dest='server_root',
                         default=None,
                         help='Document root for serving local testcases')

        if self.handlers:
            group.add_option('--disable',
                             dest='disable',
                             action='append',
                             default=[],
                             metavar='HANDLER',
                             help="Disable a default event handler (%s)" %
                                  ','.join(self.handlers.keys()))
        group.add_option('--manual', dest='manual',
                         action='store_true', default=False,
                         help="start the browser without running any tests")

        parser.add_option_group(group)

        # add option for included event handlers
        for name, handler_class in self.handlers.items():
            if hasattr(handler_class, 'add_options'):
                group = OptionGroup(parser, '%s options' % name,
                                    description=getattr(handler_class,
                                                        '__doc__', None))
                handler_class.add_options(group)
                parser.add_option_group(group)

    def profile_args(self):
        """Setup profile settings for the profile object.

        Returns arguments needed to make a profile object from
        this command-line interface.

        """
        profile_args = mozrunner.CLI.profile_args(self)
        profile_args.setdefault('addons', []).extend(ADDONS)

        profile_args['preferences'] = {
            # Bug 695026 - Re-enable e10s when fully supported
            'browser.displayedE10SPrompt': 5,
            'browser.tabs.remote': False,
            'browser.tabs.autostart': False,

            'extensions.jsbridge.port': self.jsbridge_port,
            'focusmanager.testmode': True
        }

        if self.options.debug:
            prefs = profile_args['preferences']
            prefs['extensions.checkCompatibility'] = False
            prefs['extensions.jsbridge.log'] = True
            prefs['javascript.options.strict'] = True

        return profile_args

    def command_args(self):
        """Arguments to the application to be run."""

        cmdargs = mozrunner.CLI.command_args(self)
        if self.options.debug and '-jsconsole' not in cmdargs:
            cmdargs.append('-jsconsole')

        return cmdargs

    def run(self):
        """CLI front end to run mozmill."""

        # make sure you have tests to run
        if (not self.manifest.tests) and (not self.options.manual):
            self.parser.error("No tests found. Please specify with -t or -m")

        # create a Mozrunner
        runner = self.create_runner()

        # create an instance of MozMill
        mozmill = MozMill(runner, self.jsbridge_port,
                          jsbridge_timeout=self.options.timeout,
                          handlers=self.event_handlers,
                          screenshots_path=self.options.screenshots_path,
                          server_root=self.options.server_root)

        # set debugger arguments
        mozmill.set_debugger(*self.debugger_arguments())

        # load the mozmill + jsbridge extension but don't run any tests
        # (for debugging)
        if self.options.manual:
            try:
                mozmill.start_runner()
                mozmill.runner.wait()
            except (jsbridge.ConnectionError, KeyboardInterrupt):
                pass
            return

        # run the tests
        exception = None
        tests = self.manifest.active_tests(**mozinfo.info)
        try:
            mozmill.run(tests, self.options.restart)
        except:
            exception_type, exception, tb = sys.exc_info()

        # do whatever reporting you're going to do
        results = mozmill.finish(fatal=exception is not None)

        # exit on bad stuff happen
        if exception:
            traceback.print_exception(exception_type, exception, tb)
        if exception or results.fails:
            sys.exit(1)

        # return results on success [currently unused]
        return results


def cli(args=sys.argv[1:]):
    CLI(args).run()


if __name__ == '__main__':
    cli()
