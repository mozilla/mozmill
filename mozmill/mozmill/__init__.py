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

import imp
import os
import socket
import sys
import traceback

import jsbridge
from jsbridge.network import JSBridgeDisconnectError
import mozrunner
import mozprofile
import handlers

from datetime import datetime, timedelta
from manifestdestiny import manifests
from time import sleep

# metadata
basedir = os.path.abspath(os.path.dirname(__file__))
extension_path = os.path.join(basedir, 'extension')
mozmillModuleJs = "Components.utils.import('resource://mozmill/modules/mozmill.js')"

class TestsFailedException(Exception):
    """exception to be raised when the tests fail"""
    # XXX unused

class TestResults(object):
    """
    accumulate test results for Mozmill
    """
    def __init__(self):
        self.passes = []
        self.fails = []
        self.skipped = []
        self.alltests = []

        # total test run time
        # TODO: these endpoints are a bit vague as to where they live
        self.starttime = datetime.now()
        self.endtime = None

    def events(self):
        """events the MozMill class will dispatch to"""
        return {'mozmill.endTest': self.endTest_listener}

    def stop(self, handlers, fatal=False):
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
            self.fails.append(test)
        else:
            self.passes.append(test)


class MozMill(object):
    """
    MozMill is a one-shot test runner  You should use MozMill as follows:

    m = MozMill(...)
    m.start(...)
    m.run_tests()
    m.stop()

    You should *NOT* vary from this order of execution.  If you have need to
    run different sets of tests, create a new instantiation of MozMill
    """

    def __init__(self, results, jsbridge_port=24242, jsbridge_timeout=60, handlers=()):
        """
        - results : a TestResults instance to accumulate results
        - jsbridge_port : port jsbridge uses to connect to to the application
        - jsbridge_timeout : how long to go without jsbridge communication
        - handlers : pluggable event handler
        """

        # put your data here
        self.results = results 

        # jsbridge parameters
        self.jsbridge_port = jsbridge_port
        self.jsbridge_timeout = jsbridge_timeout

        # persisted data
        self.persisted = {}

        # shutdown parameters
        self.shutdownModes = enum('default', 'user_shutdown', 'user_restart')
        self.currentShutdownMode = self.shutdownModes.default
        self.userShutdownEnabled = False

        # setup event listeners
        self.global_listeners = []
        self.listeners = []
        self.add_listener(self.persist_listener, eventType="mozmill.persist")
        self.add_listener(self.endRunner_listener, eventType='mozmill.endRunner')
        self.add_listener(self.startTest_listener, eventType='mozmill.setTest')
        self.add_listener(self.userShutdown_listener, eventType='mozmill.userShutdown')

        # add listeners for event handlers
        self.handlers = [results]
        self.handlers.extend(handlers)
        for handler in self.handlers:
            for event, method in handler.events().items():
                self.add_listener(method, eventType=event)
            if hasattr(handler, '__call__'):
                self.add_global_listener(handler)

        # disable the crashreporter
        os.environ['MOZ_CRASHREPORTER_NO_REPORT'] = '1'

    ### methods for listeners
    def add_listener(self, callback, **kwargs):
        self.listeners.append((callback, kwargs,))

    def add_global_listener(self, callback):
        self.global_listeners.append(callback)

    def persist_listener(self, obj):
        self.persisted = obj

    def startTest_listener(self, test):
        self.current_test = test

    def endRunner_listener(self, obj):
        self.endRunnerCalled = True
        
    def userShutdown_listener(self, obj):
        if obj in [self.shutdownModes.default, self.shutdownModes.user_restart, self.shutdownModes.user_shutdown]:
            self.currentShutdownMode = obj
        self.userShutdownEnabled = not self.userShutdownEnabled        

    def fire_python_callback(self, method, arg, python_callbacks_module):
        meth = getattr(python_callbacks_module, method)
        try:
            meth(arg)
        except Exception, e:
            self.endTest_listener({"name":method, "failed":1, 
                                   "python_exception_type":e.__class__.__name__,
                                   "python_exception_string":str(e),
                                   "python_traceback":traceback.format_exc(),
                                   "filename":python_callbacks_module.__file__})
            return False
        self.endTest_listener({"name":method, "failed":0, 
                               "filename":python_callbacks_module.__file__})
        return True
    
    def firePythonCallback_listener(self, obj):
        callback_file = "%s_callbacks.py" % os.path.splitext(obj['filename'])[0]
        if os.path.isfile(callback_file):
            python_callbacks_module = imp.load_source('callbacks', callback_file)
        else:
            raise Exception("No valid callback file")
        self.fire_python_callback(obj['method'], obj['arg'], python_callbacks_module)

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

    def start(self, runner):
        """prepare to run the tests"""
        
        self.runner = runner
        self.add_listener(self.firePythonCallback_listener, eventType='mozmill.firePythonCallback')
        self.endRunnerCalled = False
        
        self.runner.start()
        self.create_network()

        self.results.appinfo = self.get_appinfo(self.bridge)


    def run_tests(self, tests, sleeptime=4):
        """
        run a test file or directory
        - tests : test files or directories to run
        - sleeptime : initial time to sleep [s] (not sure why the default is 4)
        """

        frame = jsbridge.JSObject(self.bridge,
                                  "Components.utils.import('resource://mozmill/modules/frame.js')")
        sleep(sleeptime)

        # transfer persisted data
        frame.persisted = self.persisted

        for test in tests:
            # run the test directory or file
            if os.path.isdir(test):
                frame.runTestDirectory(test)
            else:
                frame.runTestFile(test)

        # Give a second for any callbacks to finish.
        sleep(1)
        
    def run(self, tests):
        """run the tests"""
        disconnected = False
        try:
            self.run_tests(tests)
        except JSBridgeDisconnectError:
            disconnected = True
            if not self.userShutdownEnabled:
                self.report_disconnect()               
            
        # shutdown the test harness
        self.stop(fatal=disconnected)

        if disconnected:
            # raise the disconnect error
            raise

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
        results.update(self.runner.get_repositoryInfo())
        return results

    ### methods for shutting down and cleanup
    
    def report_disconnect(self):
        test = self.current_test
        test['passes'] = []
        test['fails'] = [{
          'exception' : {
            'message': 'Disconnect Error: Application unexpectedly closed'
          }
        }]
        test['passed'] = 0
        test['failed'] = 1

        # send to self.results
        # XXX bad touch
        self.results.alltests.append(test)
        self.results.fails.append(test)

    def stop_runner(self, timeout=30, close_bridge=False, hard=False):
        sleep(1)
        try:
            mozmill = jsbridge.JSObject(self.bridge, mozmillModuleJs)
            mozmill.cleanQuit()
        except (socket.error, JSBridgeDisconnectError):
            pass

        if not close_bridge:
            starttime = datetime.utcnow()
            self.runner.wait(timeout=timeout)
            endtime = datetime.utcnow()
            if ( endtime - starttime ) > timedelta(seconds=timeout):
                try:
                    self.runner.stop()
                except:
                    pass
                self.runner.wait()
        else: # TODO: unify this logic with the above better
            if hard:
                self.runner.cleanup()
                return

            # XXX this call won't actually finish in the specified timeout time
            self.runner.wait(timeout=timeout)

            self.back_channel.close()
            self.bridge.close()
            x = 0
            while x < timeout:
                if self.endRunnerCalled:
                    break
                sleep(1)
                x += 1
            else:
                print "WARNING | endRunner was never called. There must have been a failure in the framework."
                self.runner.cleanup()
                sys.exit(1)

    def stop(self, fatal=False):
        """cleanup and invoking of final handlers"""

        # stop the runner
        self.stop_runner(timeout=10, close_bridge=True, hard=fatal)

        # cleanup 
        if self.runner is not None:
            self.runner.cleanup()

class MozMillRestart(MozMill):

    def __init__(self, *args, **kwargs):
        MozMill.__init__(self, *args, **kwargs)
        self.python_callbacks = [] # TODO: why do we reset this?
    
    def start(self, runner):
        # XXX note that this block is duplicated *EXACTLY* from MozMill.start
        self.runner = runner
        self.endRunnerCalled = False
        self.add_listener(self.firePythonCallback_listener, eventType='mozmill.firePythonCallback')
     
    def firePythonCallback_listener(self, obj):
        if obj['fire_now']:
            self.fire_python_callback(obj['method'], obj['arg'], self.python_callbacks_module)
        else:
            self.python_callbacks.append(obj)
        
    def start_runner(self):

        # if user_restart we don't need to start the browser back up
        if self.currentShutdownMode != self.shutdownModes.user_restart:
            self.runner.start()

        self.create_network()
        self.results.appinfo = self.get_appinfo(self.bridge)
        frame = jsbridge.JSObject(self.bridge,
                                  "Components.utils.import('resource://mozmill/modules/frame.js')")
        return frame

    def run_dir(self, test_dir, sleeptime=4):
        """run a directory of restart tests resetting the profile per directory"""

        # TODO:  document this behaviour!
        if os.path.isfile(os.path.join(test_dir, 'testPre.js')):   
            pre_test = os.path.join(test_dir, 'testPre.js')
            post_test = os.path.join(test_dir, 'testPost.js') 
            if not os.path.exists(pre_test) or not os.path.exists(post_test):
                print "Skipping "+test_dir+" does not contain both pre and post test."
                return
            
            tests = [pre_test, post_test]
        else:
            if not os.path.isfile(os.path.join(test_dir, 'test1.js')):
                print "Skipping "+test_dir+": does not contain any known test file names"
                return
            tests = []
            counter = 1
            while os.path.isfile(os.path.join(test_dir, "test"+str(counter)+".js")):
                tests.append(os.path.join(test_dir, "test"+str(counter)+".js"))
                counter += 1

        self.add_listener(self.endRunner_listener, eventType='mozmill.endRunner')

        if os.path.isfile(os.path.join(test_dir, 'callbacks.py')):
            self.python_callbacks_module = imp.load_source('callbacks', os.path.join(test_dir, 'callbacks.py'))

        for test in tests:
            frame = self.start_runner()
            self.currentShutdownMode = self.shutdownModes.default
            self.endRunnerCalled = False
            sleep(sleeptime)

            frame.persisted = self.persisted
            try:
                frame.runTestFile(test)
                while not self.endRunnerCalled:
                    sleep(.25)
                self.currentShutdownMode = self.shutdownModes.default
                self.stop_runner()
                sleep(2) # Give mozrunner some time to shutdown the browser
            except JSBridgeDisconnectError:
                if not self.userShutdownEnabled:
                    raise JSBridgeDisconnectError()
            self.userShutdownEnabled = False

            for callback in self.python_callbacks:
                self.fire_python_callback(callback['method'], callback['arg'], self.python_callbacks_module)
            self.python_callbacks = []
        
        self.python_callbacks_module = None    
        
        # Reset the profile.
        # XXX profile should have a method just to clone:
        # https://bugzilla.mozilla.org/show_bug.cgi?id=585106
        profile = self.runner.profile
        profile.cleanup()
        if profile.create_new:
            profile.profile = profile.create_new_profile(self.runner.binary)                
        for addon in profile.addons:
            profile.install_addon(addon)
        if jsbridge.extension_path not in profile.addons:
            profile.install_addon(jsbridge.extension_path)
        if extension_path not in profile.addons:
            profile.install_addon(extension_path)
        profile.set_preferences(profile.preferences)
    
    def run_tests(self, tests, sleeptime=4):

        # XXX should document what this does...it seems out of place
        self.add_listener(self.firePythonCallback_listener, eventType='mozmill.firePythonCallback')

        for test_dir in tests:

            # XXX this allows for only one sub-level of test directories
            # is this a spec or a side-effect?
            # If the former, it should be documented
            test_dirs = [d for d in os.listdir(os.path.abspath(os.path.expanduser(test_dir))) 
                         if d.startswith('test') and os.path.isdir(os.path.join(test_dir, d))]

            if not len(test_dirs):
                test_dirs = [test_dir]

            for d in test_dirs:
                d = os.path.abspath(os.path.join(test_dir, d))
                self.run_dir(d, sleeptime)

        # cleanup the profile
        self.runner.cleanup()

        # Give a second for any pending callbacks to finish
        sleep(1) 

    def stop(self, fatal=False):
        """MozmillRestart doesn't need to do cleanup as this is already done per directory"""

        if fatal:
            self.runner.cleanup()


class CLI(jsbridge.CLI):
    """command line interface to mozmill"""
    
    module = "mozmill"

    def __init__(self, args):

        # add and parse options
        jsbridge.CLI.__init__(self, args)

        # instantiate plugins
        self.event_handlers = []
        for cls in handlers.handlers():
            handler = handlers.instantiate_handler(cls, self.options)
            if handler is not None:
                self.event_handlers.append(handler)

        # read tests from manifests (if any)
        self.manifest = manifests.TestManifest(manifests=self.options.manifests)

        # expand user directory and check existence for the test
        for test in self.options.tests:
            test = os.path.expanduser(test)
            if not os.path.exists(test):
                raise Exception("Not a valid test file/directory")

            # construct metadata for test
            test_dict = { 'test': test, 'path': os.path.abspath(test) }
            if self.options.restart:
                test_dict['type'] = 'restart'
            
            self.manifest.tests.append(test_dict)

    def add_options(self, parser):
        jsbridge.CLI.add_options(self, parser)

        parser.add_option("-t", "--test", dest="tests",
                          action='append', default=[], 
                          help='Run test')
        parser.add_option("--timeout", dest="timeout", type="float",
                          default=60., 
                          help="seconds before harness timeout if no communication is taking place")
        parser.add_option("--restart", dest='restart', action='store_true',
                          default=False,
                          help="operate in restart mode")
        parser.add_option("-m", "--manifest", dest='manifests', action='append',
                          help='test manifest .ini file')

        for cls in handlers.handlers():
            cls.add_options(parser)

    def get_profile(self, *args, **kwargs):
        # XXX to refactor; the slots should be smart enough to
        # make this unnecessary
        profile = jsbridge.CLI.get_profile(self, *args, **kwargs)
        profile.install_addon(extension_path)
        return profile

    def profile_args(self):
        """
        return arguments needed to make a profile object from
        this command-line interface
        """
        profile_args = jsbridge.CLI.profile_args(self)
        profile_args['addons'].append(extension_path)
        return profile_args

    def runner_args(self):
        runner_args = jsbridge.CLI.runner_args(self)
        if '-foreground' not in runner_args['cmdargs']:
            runner_args['cmdargs'].append('-foreground')
        return runner_args

    def run_tests(self, mozmill_cls, tests, runner, results):
        """
        instantiate a mozmill object and run its tests
        - mozmill_cls : class of Mozmill to instantiate (either MozMill or MozMillRestart)
        - tests : test paths to run
        - runner : instance of a MozRunner
        """

        # create a mozmill
        mozmill = mozmill_cls(results,
                              jsbridge_port=self.options.port,
                              jsbridge_timeout=self.options.timeout,
                              handlers=self.event_handlers
                              )

        # start your mozmill
        mozmill.start(runner=runner)

        # run the tests
        mozmill.run(tests)

        
    def run(self):

        # find the tests to run
        normal_tests = []
        restart_tests = []
        for test in self.manifest.active_tests():
            if test.get('type') == 'restart':
                restart_tests.append(test['path'])
            else:
                normal_tests.append(test['path'])
            # TODO: should probably pass the whole test, maybe?

        # make sure you have tests to run
        if not (normal_tests or restart_tests):
            self.parser.error("No tests found. Please specify tests with -t or -m")

        # create a place to put results
        results = TestResults()
        
        # create a Mozrunner
        runner = self.create_runner()


        # run the tests
        e = None # runtime exception
        try:
            if normal_tests:
                self.run_tests(MozMill, normal_tests, runner, results)
                
            if restart_tests:
                self.run_tests(MozMillRestart, restart_tests, runner)

        except Exception, e:
            runner.cleanup() # cleanly shutdown
            raise

        # do whatever reporting you're going to do
        results.stop(self.event_handlers)

        # exit on bad stuff happen
        if e:
            raise
        if results.fails:
            sys.exit(1)

        # return results on success [currently unused]
        return results
        

def enum(*sequential, **named):
    # XXX to deprecate
    enums = dict(zip(sequential, range(len(sequential))), **named)
    return type('Enum', (), enums)

def cli(args=sys.argv[1:]):
    CLI(args).run()

if __name__ == '__main__':
    cli()
