# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this file,
# You can obtain one at http://mozilla.org/MPL/2.0/.


import os
import socket
import sys
import traceback
try:
    import json
except:
    import simplejson as json

import jsbridge
import mozinfo
import mozrunner
import handlers

from datetime import datetime
from jsbridge.network import JSBridgeDisconnectError
from manifestparser import TestManifest
from mozrunner.utils import get_metadata_from_egg
from optparse import OptionGroup
from time import sleep


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
        self.starttime = datetime.now()
        self.endtime = None

    def events(self):
        """Events, the MozMill class will dispatch to."""
        return {'mozmill.endTest': self.endTest_listener}

    def finish(self, handlers, fatal=False):
        """Do the final reporting and such."""
        self.endtime = datetime.utcnow()

        # handle stop events
        for handler in handlers:
            if hasattr(handler, 'stop'):
                handler.stop(self, fatal)

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
        results = m.run(tests)
        results.finish()
    """

    @classmethod
    def create(cls, results=None, jsbridge_timeout=JSBRIDGE_TIMEOUT,
               handlers=(), app='firefox', profile_args=None,
               runner_args=None):

        jsbridge_port = jsbridge.find_port()

        # select runner and profile class for the given app
        try:
            runner_class = mozrunner.runners[app]
        except KeyError:
            msg = 'Application "%s" unknown (should be one of %s)'
            raise NotImplementedError(msg % (app, mozrunner.runners.keys()))

        # get the necessary arguments to construct the profile and
        # runner instance
        profile_args = profile_args or {}
        profile_args.setdefault('addons', []).extend(ADDONS)

        preferences = profile_args.setdefault('preferences', {})
        if isinstance(preferences, dict):
            preferences['extensions.jsbridge.port'] = jsbridge_port
        elif isinstance(preferences, list):
            preferences.append(('extensions.jsbridge.port', jsbridge_port))
        else:
            raise Exception('Invalid type for preferences in profile_args')

        runner_args = runner_args or {}
        runner_args['profile_args'] = profile_args

        # create an equipped runner
        runner = runner_class.create(**runner_args)

        # create a mozmill
        return cls(runner, jsbridge_port, results=results,
                   jsbridge_timeout=jsbridge_timeout, handlers=handlers)

    def __init__(self, runner, jsbridge_port, results=None,
                 jsbridge_timeout=JSBRIDGE_TIMEOUT, handlers=()):
        """Constructor of the Mozmill class.

        Arguments:
        runner -- The MozRunner instance to run the application
        jsbridge_port -- The port the jsbridge server is running on

        Keyword arguments:
        results -- A TestResults instance to accumulate results
        jsbridge_timeout -- How long to wait without a jsbridge communication
        handlers -- pluggable event handlers

        """
        # the MozRunner
        self.runner = runner

        # execution parameters
        self.debugger = None
        self.interactive = False

        # jsbridge parameters
        self.jsbridge_port = jsbridge_port
        self.jsbridge_timeout = jsbridge_timeout
        self.bridge = self.back_channel = None

        # Report data will end up here
        self.results = results or TestResults()

        # persisted data
        self.persisted = {}

        # shutdown parameters
        self.shutdownMode = {}
        self.endRunnerCalled = False

        # setup event listeners
        self.global_listeners = []
        self.listeners = []
        # dict of listeners by event type
        self.listener_dict = {}
        self.add_listener(self.persist_listener,
                          eventType="mozmill.persist")
        self.add_listener(self.endRunner_listener,
                          eventType='mozmill.endRunner')
        self.add_listener(self.startTest_listener,
                          eventType='mozmill.setTest')
        self.add_listener(self.userShutdown_listener,
                          eventType='mozmill.userShutdown')
        self.add_listener(self.screenshot_listener,
                          eventType='mozmill.screenshot')

        # add listeners for event handlers
        self.handlers = [self.results]
        self.handlers.extend(handlers)
        for handler in self.handlers:

            # make the mozmill instance available to the handler
            handler.mozmill = self

            if hasattr(handler, 'events'):
                for event, method in handler.events().items():
                    self.add_listener(method, eventType=event)
            if hasattr(handler, '__call__'):
                self.add_global_listener(handler)

        # disable the crashreporter
        os.environ['MOZ_CRASHREPORTER_NO_REPORT'] = '1'

    ### methods for event listeners

    def add_listener(self, callback, eventType):
        self.listener_dict.setdefault(eventType, []).append(callback)
        self.listeners.append((callback, {'eventType': eventType}))

    def add_global_listener(self, callback):
        self.global_listeners.append(callback)

    def persist_listener(self, obj):
        self.persisted = obj

    def startTest_listener(self, test):
        self.current_test = test

    def endRunner_listener(self, obj):
        self.endRunnerCalled = True

    def userShutdown_listener(self, obj):
        """Listener for userShutdown events.

        Listen for the 'userShutdown' event and set some state so
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
                                                       self.jsbridge_port)
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
        if not (self.shutdownMode.get('user', False)
                and self.shutdownMode.get('restart', False)):
            if self.shutdownMode.get('resetProfile'):
                # reset the profile
                self.runner.reset()
            self.runner.start(debug_args=self.debugger,
                              interactive=self.interactive)

        # create the network
        self.create_network()

        # fetch the application info
        if not self.results.appinfo:
            self.results.appinfo = self.get_appinfo(self.bridge)

        frame = jsbridge.JSObject(self.bridge, js_module_frame)

        # set some state
        self.shutdownMode = {}
        self.endRunnerCalled = False

        # transfer persisted data
        frame.persisted = self.persisted

        # return the frame
        return frame

    def run_test_file(self, frame, path, name=None):
        """Run a single test file.

        Arguments:
        frame -- JS frame object
        path -- Path to the test file
        name -- Name of test to run (if None, run all tests)

        """
        try:
            frame.runTestFile(path, False, name)
        except JSBridgeDisconnectError:
            # if the runner is restarted via JS, run this test
            # again if the next is specified
            nextTest = self.shutdownMode.get('next')
            if not nextTest:
                # if there is not a next test,
                # throw the error up the chain
                raise
            frame = self.run_test_file(self.start_runner(), path, nextTest)

        return frame

    def run_tests(self, *tests):
        """Run the specified test files."""
        tests = list(tests)

        # note runner state
        frame = None

        # run tests
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
                                           test['path'])
            except JSBridgeDisconnectError:
                frame = None

                # Unexpected shutdown
                if not self.shutdownMode:
                    self.report_disconnect()
                    self.stop_runner()

        # stop the runner
        if frame:
            self.stop_runner()

    def run(self, *tests):
        """Run all the tests"""

        exception = None
        try:
            self.run_tests(*tests)
        except JSBridgeDisconnectError, e:
            exception_type, exception, tb = sys.exc_info()
            if not self.shutdownMode:
                self.report_disconnect()
        finally:
            # shutdown the test harness cleanly
            self.stop()

        # re-raise the most recent exception, if any
        if exception:
            raise

        return self.results

    def get_appinfo(self, bridge):
        """Collect application specific information."""
        mozmill = jsbridge.JSObject(bridge, js_module_mozmill)
        appInfo = mozmill.appInfo
        info = {'application_id': str(appInfo.ID),
                'application_name': str(appInfo.name),
                'application_version': str(appInfo.version),
                'application_locale': str(mozmill.locale),
                'platform_buildid': str(appInfo.platformBuildID),
                'platform_version': str(appInfo.platformVersion),
               }
        try:
            startupInfo = mozmill.startupInfo
            info['startupInfo'] = dict([(i, getattr(startupInfo, i))
                                        for i in startupInfo.__attributes__()])
        except KeyError:
            info['startupInfo'] = None
        info['addons'] = json.loads(mozmill.addons)
        info.update(self.runner.get_repositoryInfo())
        return info

    ### methods for shutting down and cleanup

    def report_disconnect(self):
        test = getattr(self, "current_test", {})
        test['passes'] = []
        test['fails'] = [{
          'exception': {
            'message': 'Disconnect Error: Application unexpectedly closed'
          }
        }]
        test['passed'] = 0
        test['failed'] = 1

        # Ensure that we log this disconnect as failure
        self.results.alltests.append(test)
        self.results.fails.append(test)

    def stop_runner(self, timeout=10):
        # Give a second for any callbacks to finish.
        sleep(1)

        # reset the shutdown mode
        self.shutdownMode = {}

        # quit the application via JS
        # this *will* cause a diconnect error
        # (not sure what the socket.error is all about)
        try:
            mozmill = jsbridge.JSObject(self.bridge, js_module_mozmill)
            mozmill.cleanQuit()
        except (socket.error, JSBridgeDisconnectError):
            pass

        # wait for the runner to stop
        self.runner.wait(timeout=timeout)
        if self.runner.is_running():
            raise Exception('client process shutdown unsucessful')

    def stop(self):
        """Cleanup and invoking of final handlers."""

        # ensure you have the application info for the case
        # of no tests: https://bugzilla.mozilla.org/show_bug.cgi?id=751866
        # this involves starting and stopping the browser
        if not self.results.appinfo:
            self.start_runner()
            self.stop_runner()

        # close the bridge and back channel
        if self.back_channel:
            self.back_channel.close()
            self.bridge.close()

        # cleanup
        if self.runner is not None:
            self.runner.cleanup()


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
            except BaseException, e:
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
            'extensions.jsbridge.port': self.jsbridge_port
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
                          )

        # set debugger arguments
        mozmill.set_debugger(*self.debugger_arguments())

        # load the mozmill + jsbridge extension but don't run any tests
        # (for debugging)
        if self.options.manual:
            mozmill.start_runner()
            try:
                mozmill.runner.wait()
            except KeyboardInterrupt:
                pass
            return

        # runtime exception
        exception = None

        # run the tests
        tests = self.manifest.active_tests(**mozinfo.info)
        try:
            if self.options.restart:
                for test in tests:
                    mozmill.run(test)
                    # reset the profile
                    runner.reset()
            else:
                mozmill.run(*tests)
        except:
            exception_type, exception, tb = sys.exc_info()

        # do whatever reporting you're going to do
        results = mozmill.results
        results.finish(self.event_handlers, fatal=exception is not None)

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
