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
import threading
import traceback

import jsbridge
from jsbridge.network import JSBridgeDisconnectError
import mozrunner
import mozprofile

import handlers

from datetime import datetime, timedelta
from time import sleep

basedir = os.path.abspath(os.path.dirname(__file__))

extension_path = os.path.join(basedir, 'extension')

mozmillModuleJs = "Components.utils.import('resource://mozmill/modules/mozmill.js')"


class TestsFailedException(Exception):
    """exception to be raised when the tests fail"""
    # XXX unused

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

    def __init__(self, jsbridge_port=24242, jsbridge_timeout=60, handlers=()):
        """
        - runner_class : which mozrunner class to use
        - profile_class : which class to use to generate application profiles
        - jsbridge_port : port jsbridge uses to connect to to the application
        - jsbridge_timeout : how long to go without jsbridge communication
        - handlers : pluggable event handler
        """
        

        # jsbridge parameters
        self.jsbridge_port = jsbridge_port
        self.jsbridge_timeout = jsbridge_timeout

        # test parameters: filled in from event system
        self.passes = [] ; self.fails = [] ; self.skipped = []
        self.alltests = []

        self.persisted = {}
        self.endRunnerCalled = False
        self.shutdownModes = enum('default', 'user_shutdown', 'user_restart')
        self.currentShutdownMode = self.shutdownModes.default
        self.userShutdownEnabled = False
        self.test = None

        # test time
        self.starttime = self.endtime = None

        # setup event listeners
        self.global_listeners = []
        self.listeners = []
        self.add_listener(self.persist_listener, eventType="mozmill.persist")
        self.add_listener(self.endTest_listener, eventType='mozmill.endTest')
        self.add_listener(self.endRunner_listener, eventType='mozmill.endRunner')
        self.add_listener(self.startTest_listener, eventType='mozmill.setTest')
        self.add_listener(self.userShutdown_listener, eventType='mozmill.userShutdown')

        # add listeners for event handlers
        # XXX should be done in a better way
        self.handlers = handlers
        for handler in self.handlers:
            handler.mozmill = self # XXX bad touch
            for event, method in handler.events().items():
                self.add_listener(method, eventType=event)
            if hasattr(handler, '__call__'):
                self.add_global_listener(handler)

    ### methods for listeners

    def add_listener(self, callback, **kwargs):
        self.listeners.append((callback, kwargs,))

    def add_global_listener(self, callback):
        self.global_listeners.append(callback)

    def persist_listener(self, obj):
        self.persisted = obj

    def startTest_listener(self, test):
        self.current_test = test


    def endTest_listener(self, test):

        self.alltests.append(test)
        if test.get('skipped', False):
            self.skipped.append(test)
        elif test['failed'] > 0:
            self.fails.append(test)
        else:
            self.passes.append(test)

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

        self.runner = runner
        self.add_listener(self.firePythonCallback_listener, eventType='mozmill.firePythonCallback')

        self.endRunnerCalled = False
        
        self.runner.start()
        self.create_network()
        self.appinfo = self.get_appinfo(self.bridge)

        self.starttime = datetime.utcnow()

    def run_tests(self, test, sleeptime=4):
        """
        run a test file or directory
        - test : test file or directory to run
        - sleeptime : initial time to sleep [s] (not sure why the default is 4)
        """

        self.test = test

        frame = jsbridge.JSObject(self.bridge,
                                  "Components.utils.import('resource://mozmill/modules/frame.js')")
        sleep(sleeptime)

        # transfer persisted data
        frame.persisted = self.persisted

        # run the test directory or file
        if os.path.isdir(test):
            frame.runTestDirectory(test)
        else:
            frame.runTestFile(test)

        # Give a second for any callbacks to finish.
        sleep(1)

    def run(self, test):
        """run the tests"""
        disconnected = False
        try:
            self.run_tests(test)
        except JSBridgeDisconnectError:
            disconnected = True
            if not self.userShutdownEnabled:
                self.report_disconnect()               
            
        # shutdown the test harness
        self.stop(fatal=disconnected)

        # exit (could be moved up to CLI)
        if self.fails or disconnected:
            sys.exit(1)


    ### information function 

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
        self.alltests.append(test)
        self.fails.append(test)

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
                self.runner.kill()
                self.runner.profile.cleanup()
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
                self.runner.stop()
                self.runner.profile.cleanup()
                sys.exit(1)

    def stop(self, fatal=False):
        """cleanup"""

        # record test end time
        self.endtime = datetime.utcnow()

        # handle stop events
        for handler in self.handlers:
            if hasattr(handler, 'stop'):
                handler.stop(fatal)
                
        # stop the runner
        self.stop_runner(timeout=10, close_bridge=True, hard=fatal)

        # cleanup the profile if you need to
        if self.runner is not None:
            try:
                self.runner.profile.cleanup()
            except OSError:
                pass # assume profile is already cleaned up

class MozMillRestart(MozMill):

    def __init__(self, *args, **kwargs):
        MozMill.__init__(self, *args, **kwargs)
        self.python_callbacks = [] # why is this here? please record intent
    
    def start(self, runner):

        # XXX note that this block is duplicated *EXACTLY* from MozMill.start
        self.runner = runner
        self.endRunnerCalled = False

        self.add_listener(self.firePythonCallback_listener, eventType='mozmill.firePythonCallback')

        self.starttime = datetime.utcnow()
     
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
        self.appinfo = self.get_appinfo(self.bridge)
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
                print "Skipping "+test_dir+" does not contain any known test file names"
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
    
    def run_tests(self, test_dir, sleeptime=4):

        self.test = test_dir
        
        # XXX this allows for only one sub-level of test directories
        # is this a spec or a side-effect?
        # If the former, it should be documented
        test_dirs = [d for d in os.listdir(os.path.abspath(os.path.expanduser(test_dir))) 
                     if d.startswith('test') and os.path.isdir(os.path.join(test_dir, d))]
        self.add_listener(self.firePythonCallback_listener, eventType='mozmill.firePythonCallback')
        if not len(test_dirs):
            test_dirs = [test_dir]

        for d in test_dirs:
            d = os.path.abspath(os.path.join(test_dir, d))
            self.run_dir(d, sleeptime)

        # cleanup the profile
        self.runner.profile.cleanup()

        # Give a second for any pending callbacks to finish
        sleep(1) 

    def stop(self, fatal=False):
        """MozmillRestart doesn't need to do cleanup as this is already done per directory"""

        # XXX this is a one-off to fix bug 581733
        # really, the entire shutdown sequence should be reconsidered and
        # made more robust. 
        # See https://bugzilla.mozilla.org/show_bug.cgi?id=581733#c20
        # This will *NOT* work with all edge cases and it shouldn't be
        # expected that adding on more kills() for each edge case will ever
        # be able to fix a systematic issue by patching holes
        if fatal:
            try:
                self.runner.kill()
                self.runner.profile.cleanup()
            except:
                pass

        # and, note, we're already paying for it!
        # now I need to call Mozmill.stop but of course I can't
        # and since cut + paste is evil I'll actually have to figure
        # out what we should be doing here
                    


class CLI(jsbridge.CLI):
    module = "mozmill"

    test_help = 'Run test file or directory'

    def __init__(self, args):

        # add and parse options
        jsbridge.CLI.__init__(self, args)

        # decide whether we're running in restart mode or not
        if self.options.restart:
            self.mozmill_class = MozMillRestart
        else:
            self.mozmill_class = MozMill

        # instantiate plugins
        event_handlers = []
        for cls in handlers.handlers():
            handler = handlers.instantiate_handler(cls, self.options)
            if handler is not None:
                event_handlers.append(handler)

        # create a mozmill
        self.mozmill = self.mozmill_class(jsbridge_port=int(self.options.port),
                                          
                                          jsbridge_timeout=self.options.timeout,
                                          handlers=event_handlers
                                          )

        # expand user directory and check existence for the test
        if self.options.test:
            self.options.test = os.path.abspath(os.path.expanduser(self.options.test))
            if ( ( not os.path.isdir(self.options.test) )
                 and ( not os.path.isfile(self.options.test) ) ):
                raise Exception("Not a valid test file/directory")

    def add_options(self, parser):
        jsbridge.CLI.add_options(self, parser)

        parser.add_option("-t", "--test", dest="test", default=None, 
                          help=self.test_help)
        parser.add_option("--timeout", dest="timeout", type="float",
                          default=60., 
                          help="seconds before harness timeout if no communication is taking place")
        parser.add_option("--restart", dest='restart', action='store_true',
                          default=False,
                          help="operate in restart mode")

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
        
        
        
    def run(self):
        # XXX this is a complicated function that should probably be broken up

        # create a Mozrunner
        runner = mozrunner.create_runner(self.profile_class, self.runner_class)
        # make sure the application starts in the foreground
        # XXX BAD; cleanup!
        if '-foreground' not in runner.cmdargs:
            runner.cmdargs.append('-foreground')
            
        self.mozmill.start(runner=runner)

        if self.options.test:
            self.mozmill.run(self.options.test)
        else:
            # TODO: document use case
            # probably take out of this function entirely
            if self.options.shell:
                self.start_shell(runner)
            else:
                try:
                    if not hasattr(runner, 'process_handler'):
                        runner.start()
                    runner.wait()
                except KeyboardInterrupt:
                    runner.stop()

            if self.mozmill.runner is not None:
                self.mozmill.runner.profile.cleanup()
                

def enum(*sequential, **named):
    # XXX to deprecate
    enums = dict(zip(sequential, range(len(sequential))), **named)
    return type('Enum', (), enums)

def cli(args=sys.argv[1:]):
    CLI(args).run()

if __name__ == '__main__':
    cli()
