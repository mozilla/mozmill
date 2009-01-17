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
import urllib
from time import sleep
import logging
logger = logging.getLogger('mozmill')

import jsbridge
from jsbridge import global_settings
from jsbridge import network, events
from jsbridge.jsobjects import JSObject

basedir = os.path.abspath(os.path.dirname(__file__))

global_settings.MOZILLA_PLUGINS.append(os.path.join(basedir, 'extension'))

passes = []
fails = []
skipped = []

def endTest_listener(test):
    if test.get('skipped', False):
        print 'Test Skipped : '+test['name']+' | '+test.get('skipped_reason', '')
        skipped.append(test)
    elif test['failed'] > 0:
        print 'Test Failed : '+test['name']+' in '+test['filename']
        fails.append(test)
    else:
        passes.append(test)

def endRunner_listener(obj):
    print 'Passed '+str(len(passes))+' :: Failed '+str(len(fails))+' :: Skipped '+str(len(skipped))

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

def run_tests(moz, test):
    events.add_listener(endTest_listener, event='mozmill.endTest')
    events.add_listener(endRunner_listener, event='mozmill.endRunner')
    
    frame = JSObject(network.bridge, "Components.utils.import('resource://mozmill/modules/frame.js')")
    
    if os.path.isdir(test):
        frame.runTestDirectory(test)
    else:
        frame.runTestFile(test)
    moz.stop()
    if len(fails) > 0:
        sys.exit(1)

def main():
    parser = jsbridge.parser
    parser.remove_option('-l')
    parser.set_default('launch', True)
    parser.add_option("-t", "--test", 
                      dest="test", default=False,
                      help="Run test file or directory.")
    parser.add_option("-l", "--logfile",
                      dest="logfile", default=None,
                      help="Log all events to file.")
    parser.add_option("--show-errors",
                      dest="showerrors", default=False, action="store_true",
                      help="Print logger errors to the console.")
    parser.add_option("--shell",
                      dest="shell", default=False, action="store_true",
                      help="Bring up the jsbridge shell. For debugging only, incompatible with (-t, --test)")
    
    (options, args) = parser.parse_args()
    
    events.add_global_listener(LoggerListener())
    
    if options.showerrors:
        outs = logging.StreamHandler()
        outs.setLevel(logging.ERROR)
        formatter = logging.Formatter("%(levelname)s - %(message)s")
        outs.setFormatter(formatter)
        logger.addHandler(outs)
    
    if options.logfile:
        logging.basicConfig(filename=options.logfile, filemode='w', level=logging.DEBUG)
        
    if (not options.showall) and (not options.showerrors) and (not options.logfile):
        logging.basicConfig(level=logging.CRITICAL)
    
    if options.test:
        if options.showall:
            logging.basicConfig(level=logging.DEBUG)
            options.showall = False

        moz = jsbridge.cli(shell=False, options=options, block=False)
        run_tests(moz, os.path.abspath(os.path.expanduser(options.test)))
        
    else:    
        jsbridge.cli(shell=options.shell, options=options)


