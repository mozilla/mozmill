# ***** BEGIN LICENSE BLOCK *****
# Version: MPL 1.1/GPL 2.0/LGPL 2.1
#
# The contents of this file are subject to the Mozilla Public License Version
# 1.1 (the "License"); you may not use this file except in compliance with
# the License. You may obtain a copy of the License at
# http://www.mozilla.org/MPL/
#
# Software distributed under the License is distributed on an "AS IS" basis,
# WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
# for the specific language governing rights and limitations under the
# License.
#
# The Original Code is Mozilla Corporation Code.
#
# The Initial Developer of the Original Code is
# Mikeal Rogers.
# Portions created by the Initial Developer are Copyright (C) 2008
# the Initial Developer. All Rights Reserved.
#
# Contributor(s):
#  Mikeal Rogers <mikeal.rogers@gmail.com>
#  Henrik Skupin <hskupin@mozilla.com>
#  Clint Talbert <ctalbert@mozilla.com>
#
# Alternatively, the contents of this file may be used under the terms of
# either the GNU General Public License Version 2 or later (the "GPL"), or
# the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
# in which case the provisions of the GPL or the LGPL are applicable instead
# of those above. If you wish to allow use of your version of this file only
# under the terms of either the GPL or the LGPL, and not to allow others to
# use your version of this file under the terms of the MPL, indicate your
# decision by deleting the provisions above and replace them with the notice
# and other provisions required by the GPL or the LGPL. If you do not delete
# the provisions above, a recipient may use your version of this file under
# the terms of any one of the MPL, the GPL or the LGPL.
#
# ***** END LICENSE BLOCK *****

import os
import socket
import sys
import traceback
try:
    import json
except:
    import simplejson as json

import jsbridge
import manifestparser
import mozrunner
import mozprofile
import handlers

from datetime import datetime, timedelta
from jsbridge.network import JSBridgeDisconnectError
from mozrunner.utils import get_metadata_from_egg
from optparse import OptionGroup
from time import sleep

# metadata
basedir = os.path.abspath(os.path.dirname(__file__))
extension_path = os.path.join(basedir, 'extension')
mozmillModuleJs = "Components.utils.import('resource://mozmill/modules/mozmill.js')"
package_metadata = get_metadata_from_egg('mozmill')

# defaults
ADDONS = [extension_path, jsbridge.extension_path]
JSBRIDGE_PORT = 24242
JSBRIDGE_TIMEOUT = 60. # timeout for jsbridge

class TestResults(object):
    """
    class to accumulate test results for Mozmill
    """
    def __init__(self):

        # test statistics
        self.passes = []
        self.fails = []
        self.skipped = []
        self.alltests = []

        # total test run time
        self.starttime = datetime.now()
        self.endtime = None

        # application information
        self.appinfo = None

        # other information
        self.mozmill_version = package_metadata.get('Version')
        self.screenshots = []

    def events(self):
        """events the MozMill class will dispatch to"""
        return {'mozmill.endTest': self.endTest_listener}

    def finish(self, handlers, fatal=False):
        """do final reporting and such"""
        self.endtime = datetime.utcnow()

        # handle stop events
        for handler in handlers:
            if hasattr(handler, 'stop'):
                handler.stop(self, fatal)

    ### event listener

    def endTest_listener(self, test):
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
    """
    MozMill is a test runner  You should use MozMill as follows:

    m = MozMill(...)
    results = m.run(tests)
    results.finish()
    """

    @classmethod
    def create(cls, results=None, jsbridge_port=JSBRIDGE_PORT, jsbridge_timeout=JSBRIDGE_TIMEOUT, handlers=(),
               app='firefox', profile_args=None, runner_args=None):
      
        # select runner and profile class for the given app
        try:
            runner_class = mozrunner.runners[app]
        except KeyError:
            raise NotImplementedError('Application "%s" unknown (should be one of %s)' % (app, mozrunner.runners.keys()))
          
        # get the necessary arguments to construct the profile and runner instance
        profile_args = profile_args or {}
        runner_args = runner_args or {}
        profile_args.setdefault('addons', []).extend(ADDONS)
        cmdargs = runner_args.setdefault('cmdargs', [])
        if '-jsbridge' not in cmdargs:
            cmdargs += ['-jsbridge', '%d' % jsbridge_port]
        runner_args['profile_args'] = profile_args
            
        # create an equipped runner
        runner = runner_class.create(**runner_args)
            
        # create a mozmill
        return cls(runner, results=results, jsbridge_port=jsbridge_port, jsbridge_timeout=jsbridge_timeout, handlers=handlers)

    def __init__(self, runner, results=None, jsbridge_port=JSBRIDGE_PORT, jsbridge_timeout=JSBRIDGE_TIMEOUT, handlers=()):
        """
        - runner : a MozRunner instance to run the app
        - results : a TestResults instance to accumulate results
        - jsbridge_port : port jsbridge uses to connect to to the application
        - jsbridge_timeout : how long to go without jsbridge communication
        - handlers : pluggable event handler
        """

        # the MozRunner
        self.runner = runner

        # mozmill puts your data here
        self.results = results or TestResults()

        # jsbridge parameters
        self.jsbridge_port = jsbridge_port
        self.jsbridge_timeout = jsbridge_timeout
        self.bridge = self.back_channel = None

        # persisted data
        self.persisted = {}

        # shutdown parameters
        self.shutdownMode = {}
        self.endRunnerCalled = False

        # setup event listeners
        self.global_listeners = []
        self.listeners = []
        self.listener_dict = {} # dict of listeners by event type
        self.add_listener(self.persist_listener, eventType="mozmill.persist")
        self.add_listener(self.endRunner_listener, eventType='mozmill.endRunner')
        self.add_listener(self.startTest_listener, eventType='mozmill.setTest')
        self.add_listener(self.userShutdown_listener, eventType='mozmill.userShutdown')
        self.add_listener(self.screenShot_listener, eventType='mozmill.screenShot');

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
        """
        listen for the 'userShutdown' event and set some state so
        that the (python) instance knows what to do.  The obj should
        have the following keys:
        - restart : whether the application is to be restarted
        - user : whether the shutdown was triggered via test JS
        - next : for the restart cases, which test to run next
        - resetProfile : reset the profile after shutdown
        """
        self.shutdownMode = obj

    def screenShot_listener(self, obj): 
        self.results.screenshots.append(obj)
    
    def fire_event(self, event, obj):
        """fire an event from the python side"""

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
        self.back_channel, self.bridge = jsbridge.wait_and_create_network("127.0.0.1",
                                                                          self.jsbridge_port)

        # set a timeout on jsbridge actions in order to ensure termination
        self.back_channel.timeout = self.bridge.timeout = self.jsbridge_timeout
        
        # Assign listeners to the back channel
        for listener in self.listeners:
            self.back_channel.add_listener(listener[0], **listener[1])
        for global_listener in self.global_listeners:
            self.back_channel.add_global_listener(global_listener)

    def start_runner(self):
        """start the MozRunner"""

        # if user restart we don't need to start the browser back up
        if not (self.shutdownMode.get('user', False)
                and self.shutdownMode.get('restart', False)):
            if self.shutdownMode.get('resetProfile'):
                self.runner.reset() # reset the profile
            self.runner.start()
            
        # create the network
        self.create_network()

        # fetch the application info
        if not self.results.appinfo:
            self.results.appinfo = self.get_appinfo(self.bridge)

        frame = jsbridge.JSObject(self.bridge,
                                  "Components.utils.import('resource://mozmill/modules/frame.js')")

        # set some state
        self.shutdownMode = {}
        self.endRunnerCalled = False 
        frame.persisted = self.persisted # transfer persisted data

        # return the frame
        return frame

    def run_test_file(self, frame, path, name=None):
        """
        run a single test file
        - frame : JS frame object
        - path : path to the test file
        - name : name of test to run; if None, run all tests
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
            frame = self.start_runner()
            self.run_test_file(frame, path, nextTest)

    def run_tests(self, *tests):
        """run test files"""
        tests = list(tests)

        # note runner state
        started = False
        
        # run tests
        while tests:
            test = tests.pop(0)
            self.running_test = test
            if 'disabled' in test: # skip test

                # see frame.js:events.endTest
                obj = {'filename': test['path'],
                       'passed': 0,
                       'failed': 0,
                       'passes': [],
                       'fails': [],
                       'name': os.path.basename(test['path']), # XXX should be consistent with test.__name__ ; see bug 643480
                       'skipped': True,
                       'skipped_reason': test['disabled']
                       }
                self.fire_event('endTest', obj)
                continue
              
            try:
                if not started:
                    frame = self.start_runner()
                    started = True
                self.run_test_file(frame, test['path'])
            except JSBridgeDisconnectError:
                if self.shutdownMode:
                    # if the test initiates shutdown and there are other tests
                    # signal that the runner is stopped
                    started = False
                else:
                    self.report_disconnect()
                    self.stop_runner()
                    started = False

        # stop the runner
        if started:
            self.stop_runner()

    def run(self, *tests):
        """run the tests"""

        exception = None
        try:
            self.run_tests(*tests)
        except JSBridgeDisconnectError, e:
            exception_type, exception, tb = sys.exc_info()
            if not self.shutdownMode:
                self.report_disconnect()
        finally:
            self.stop() # shutdown the test harness cleanly
              
        # reraise the most recent exception, if any
        if exception:
            raise
        
        return self.results
            
    def get_appinfo(self, bridge):
        """ Collect application specific information """
        mozmill = jsbridge.JSObject(bridge, mozmillModuleJs)
        appInfo = mozmill.appInfo
        results = {'application_id': str(appInfo.ID),
                   'application_name': str(appInfo.name),
                   'application_version': str(appInfo.version),
                   'application_locale': str(mozmill.locale),
                   'platform_buildid': str(appInfo.platformBuildID),
                   'platform_version': str(appInfo.platformVersion),
                  }
        try:
            startupInfo = mozmill.startupInfo
            results['startupInfo'] = dict([(i, getattr(startupInfo, i))
                                            for i in startupInfo.__attributes__()])
        except KeyError:
            results['startupInfo'] = None
        results['addons'] = json.loads(mozmill.addons)
        results.update(self.runner.get_repositoryInfo())
        return results

    ### methods for shutting down and cleanup
    
    def report_disconnect(self):
        test = getattr(self, "current_test", {})
        test['passes'] = []
        test['fails'] = [{
          'exception' : {
            'message': 'Disconnect Error: Application unexpectedly closed'
          }
        }]
        test['passed'] = 0
        test['failed'] = 1

        # send to self.results
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
            mozmill = jsbridge.JSObject(self.bridge, mozmillModuleJs)
            mozmill.cleanQuit()
        except (socket.error, JSBridgeDisconnectError):
            pass

        # wait for the runner to stop
        self.runner.wait(timeout=timeout)
        if self.runner.is_running():
            raise Exception('client process shutdown unsucessful')

    def stop(self):
        """cleanup and invoking of final handlers"""

        # close the bridge and back channel
        if self.back_channel:
            self.back_channel.close()
            self.bridge.close()

        # cleanup 
        if self.runner is not None:
            self.runner.cleanup()


### method for test collection

def collect_tests(path):
    """find all tests for a given path"""

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
    """command line interface to mozmill"""
    
    module = "mozmill"

    def __init__(self, args):

        # event handler plugin names
        self.handlers = {}
        for handler_class in handlers.handlers():
            name = getattr(handler_class, 'name', handler_class.__name__)
            self.handlers[name] = handler_class

        # add and parse options
        mozrunner.CLI.__init__(self, args)

        # read tests from manifests (if any)
        self.manifest = manifestparser.TestManifest(manifests=self.options.manifests)

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
            _handler = handlers.instantiate_handler(handler_class, self.options)
            if _handler is not None:
                self.event_handlers.append(_handler)

    def add_options(self, parser):
        """add command line options"""
        
        group = OptionGroup(parser, 'MozRunner options')
        mozrunner.CLI.add_options(self, group)
        parser.add_option_group(group)

        group = OptionGroup(parser, 'MozMill options')
        group.add_option("-t", "--test", dest="tests",
                         action='append', default=[],
                         help='Run test')
        group.add_option("--timeout", dest="timeout", type="float",
                         default=JSBRIDGE_TIMEOUT,
                         help="seconds before harness timeout if no communication is taking place")
        group.add_option("--restart", dest='restart', action='store_true',
                         default=False,
                         help="restart the application and reset the profile between each test file")
        group.add_option("-m", "--manifest", dest='manifests',
                         action='append',
                         metavar='MANIFEST',
                         help='test manifest .ini file')
        group.add_option('-D', '--debug', dest="debug", 
                         action="store_true",
                         help="debug mode",
                         default=False)
        group.add_option('-P', '--port', dest="port", type="int",
                         default=JSBRIDGE_PORT,
                         help="TCP port to run jsbridge on.")
        group.add_option('--list-tests', dest='list_tests',
                         action='store_true', default=False,
                         help="list test files that would be run, in order")
        group.add_option('--handler', dest='handlers', metavar='PATH:CLASS',
                         action='append', default=[],
                         help="specify a event handler given a file PATH and the CLASS in the file")
        if self.handlers:
            group.add_option('--disable', dest='disable', metavar='HANDLER',
                             action='append', default=[],
                             help="disable a default event handler (%s)" % ','.join(self.handlers.keys()))

        parser.add_option_group(group)

        # add option for included event handlers
        for name, handler_class in self.handlers.items():
            if hasattr(handler_class, 'add_options'):
                group = OptionGroup(parser, '%s options' % name,
                                    description=getattr(handler_class, '__doc__', None))
                handler_class.add_options(group)
                parser.add_option_group(group)
                                

    def profile_args(self):
        """
        return arguments needed to make a profile object from
        this command-line interface
        """
        profile_args = mozrunner.CLI.profile_args(self)
        profile_args.setdefault('addons', []).extend(ADDONS)

        if self.options.debug:
            profile_args['preferences'] = {
              'extensions.checkCompatibility': False,
              'javascript.options.strict': True
            }
        return profile_args

    def command_args(self):
        """arguments to the application to be run"""
        
        cmdargs = mozrunner.CLI.command_args(self)
        if self.options.debug and '-jsconsole' not in cmdargs:
            cmdargs.append('-jsconsole')
        if '-jsbridge' not in cmdargs:
            cmdargs += ['-jsbridge', '%d' % self.options.port]
        if '-foreground' not in cmdargs:
            cmdargs.append('-foreground')
        return cmdargs
        
    def run(self):

        # make sure you have tests to run
        if not self.manifest.tests:
            self.parser.error("No tests found. Please specify tests with -t or -m")
        
        # create a place to put results
        results = TestResults()
        
        # create a Mozrunner
        runner = self.create_runner()

        # create a MozMill
        mozmill = MozMill(runner, results,
                          jsbridge_port=self.options.port,
                          jsbridge_timeout=self.options.timeout,
                          handlers=self.event_handlers
                          )

        # run the tests
        exception = None # runtime exception
        try:
            if self.options.restart:
                for test in self.manifest.tests:
                    mozmill.run(test)
                    runner.reset() # reset the profile
            else:
                mozmill.run(*self.manifest.tests)
        except:
            exception_type, exception, tb = sys.exc_info()

        # do whatever reporting you're going to do
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
