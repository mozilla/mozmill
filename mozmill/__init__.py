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
import sys
import copy
from datetime import datetime

import logging
logger = logging.getLogger('mozmill')

import simplejson
import jsbridge
import mozrunner

basedir = os.path.abspath(os.path.dirname(__file__))

extension_path = os.path.join(basedir, 'extension')

class LoggerListener(object):
    cases = {
        'mozmill.pass':   lambda obj: logger.debug('Test Pass: '+repr(obj)),
        'mozmill.fail':   lambda obj: logger.error('Test Failure: '+repr(obj)),
        'mozmill.skip':   lambda obj: logger.info('Test Skipped: ' +repr(obj))
    }
    
    class default(object):
        def __init__(self, eName): self.eName = eName
        def __call__(self, obj): logger.info(self.eName+' :: '+repr(obj))
    
    def __call__(self, eName, obj):
        if self.cases.has_key(eName):
            self.cases[eName](obj)
        else:
            self.cases[eName] = self.default(eName)
            self.cases[eName](obj)

class MozMill(object):
    
    def __init__(self, runner_class=mozrunner.FirefoxRunner, 
                 profile_class=mozrunner.FirefoxProfile, jsbridge_port=24242):
        self.runner_class = runner_class
        self.profile_class = profile_class
        self.jsbridge_port = jsbridge_port
        self.passes = [] ; self.fails = [] ; self.skipped = []
        self.alltests = []
        
    
    def start(self, profile=None, runner=None):
        if not profile:
            profile = self.profile_class(plugins=[jsbridge.extension_path, extension_path])
        if not runner:
            runner = self.runner_class(profile=self.profile, 
                                       cmdargs=["-jsbridge", str(self.jsbridge_port)])
        
        self.profile = profile; self.runner = runner
        self.runner.start()
        self.back_channel, self.bridge = jsbridge.wait_and_create_network("127.0.0.1", self.jsbridge_port)
    
    def run_tests(self, test, report=False):
        
        self.back_channel.add_listener(self.endTest_listener, eventType='mozmill.endTest')
        self.back_channel.add_listener(self.endRunner_listener, eventType='mozmill.endRunner')

        frame = jsbridge.JSObject(self.bridge, "Components.utils.import('resource://mozmill/modules/frame.js')")

        starttime = datetime.utcnow().isoformat()

        if os.path.isdir(test):
            frame.runTestDirectory(test)
        else:
            frame.runTestFile(test)

        endtime = datetime.utcnow().isoformat()

        if report:
            appInfoJs = "Components.classes['@mozilla.org/xre/app-info;1'].getService(Components.interfaces.nsIXULAppInfo)"
            appInfo = jsbridge.JSObject(self.bridge, appInfoJs)

            results = {'testType':'mozmill', 'starttime':starttime, 
                       'endtime':endtime, 'tests':self.alltests}
            results['appInfo.id'] = str(appInfo.ID)
            results['buildid'] = str(appInfo.appBuildID)
            results['appInfo.platformVersion'] = appInfo.platformVersion
            results['appInfo.platformBuildID'] = appInfo.platformBuildID       
            sysname, nodename, release, version, machine = os.uname()
            sysinfo = {'os.name':sysname, 'hostname':nodename, 'os.version.number':release,
                       'os.version.string':version, 'arch':machine}
            results['sysinfo'] = sysinfo
            results['testPath'] = test
            import httplib2
            http = httplib2.Http()
            response, content = http.request(report, 'POST', body=simplejson.dumps(results))
        
    def endTest_listener(self, test):
        self.alltests.append(test)
        if test.get('skipped', False):
            print 'Test Skipped : '+test['name']+' | '+test.get('skipped_reason', '')
            self.skipped.append(test)
        elif test['failed'] > 0:
            print 'Test Failed : '+test['name']+' in '+test['filename']
            self.fails.append(test)
        else:
            self.passes.append(test)

    def endRunner_listener(self, obj):
        print 'Passed '+str(len(self.passes))+' :: Failed '+str(len(self.fails))+' :: Skipped '+str(len(self.skipped))
    
    
class CLI(jsbridge.CLI):
    parser_options = copy.copy(jsbridge.CLI.parser_options)
    parser_options[("-t", "--test",)] = dict(dest="test", default=False, 
                                             help="Run test file or directory.")
    parser_options[("-l", "--logfile",)] = dict(dest="logfile", default=None,
                                                help="Log all events to file.")
    parser_options[("--show-errors",)] = dict(dest="showerrors", default=False, 
                                              action="store_true",
                                              help="Print logger errors to the console.")
    parser_options[("--report",)] = dict(dest="report", default=False,
                                         help="Report the results. Requires url to results server.")
    parser_options[("--showall",)] = dict(dest="showall", default=False,
                                         help="Show all test output.")
    
    
    def get_profile(self, *args, **kwargs):
        profile = super(CLI, self).get_profile(*args, **kwargs)
        profile.install_plugin(extension_path)
        return profile
        
    def run(self):
        runner = self.parse_and_get_runner()
        m = MozMill()
        m.start(runner=runner, profile=runner.profile)
        m.back_channel.add_global_listener(LoggerListener())
        if self.options.showerrors:
            outs = logging.StreamHandler()
            outs.setLevel(logging.ERROR)
            formatter = logging.Formatter("%(levelname)s - %(message)s")
            outs.setFormatter(formatter)
            logger.addHandler(outs)
        if self.options.logfile:
            logging.basicConfig(filename=self.options.logfile, 
                                filemode='w', level=logging.DEBUG)
        if ( not self.options.showall) and (
             not self.options.showerrors) and (
             not self.options.logfile):
            logging.basicConfig(level=logging.CRITICAL)
        
        if self.options.test:
            if self.options.showall:
                logging.basicConfig(level=logging.DEBUG)
                self.options.showall = False
            m.run_tests(os.path.abspath(os.path.expanduser(self.options.test)), 
                        self.options.report)
            m.runner.stop()
            if len(m.fails) > 0:
                sys.exit(1)
        else:
            if self.options.shell:
                self.start_shell(runner)
            else:
                try:
                    runner.wait()
                except KeyboardInterrupt:
                    runner.stop()

def cli():
    CLI().run()

# 
# def main():
#     events.add_global_listener(LoggerListener())
#     
#     if options.showerrors:
#         outs = logging.StreamHandler()
#         outs.setLevel(logging.ERROR)
#         formatter = logging.Formatter("%(levelname)s - %(message)s")
#         outs.setFormatter(formatter)
#         logger.addHandler(outs)
#     
#     if options.logfile:
#         logging.basicConfig(filename=options.logfile, filemode='w', level=logging.DEBUG)
#         
#     if (not options.showall) and (not options.showerrors) and (not options.logfile):
#         logging.basicConfig(level=logging.CRITICAL)
#     
#     if options.test:
#         if options.showall:
#             logging.basicConfig(level=logging.DEBUG)
#             options.showall = False
# 
#         moz = jsbridge.cli(shell=False, options=options, block=False)
#         run_tests(moz, os.path.abspath(os.path.expanduser(options.test)), options.report)
#         
#     else:    
#         jsbridge.cli(shell=options.shell, options=options)
# 
# 
