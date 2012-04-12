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
# The Initial Developer of the Original Code is Mikeal Rogers.
# Portions created by the Initial Developer are Copyright (C) 2008 -2009
# the Initial Developer. All Rights Reserved.
# 
# Contributor(s):
#  Mikeal Rogers <mikeal.rogers@gmail.com>
#  Henrik Skupin <mail@hskupin.info>
#  David Burns <info@theautomatedtester.co.uk>
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

import socket
import os
import copy
import asyncore

from time import sleep
from network import Bridge, BackChannel, create_network
from jsobjects import JSObject

import mozrunner

settings_env = 'JSBRIDGE_SETTINGS_FILE'

parent = os.path.abspath(os.path.dirname(__file__))
extension_path = os.path.join(parent, 'extension')

window_string = "Components.classes['@mozilla.org/appshell/window-mediator;1'].getService(Components.interfaces.nsIWindowMediator).getMostRecentWindow('')"

wait_to_create_timeout = 60

def find_port():
    free_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    free_socket.bind(('127.0.0.1', 0))
    port = free_socket.getsockname()[1]
    free_socket.close()

    return port

def wait_and_create_network(host, port, timeout=wait_to_create_timeout):
    ttl = 0
    while ttl < timeout:
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.connect((host, port))
            s.close()
            break
        except socket.error:
            pass
        sleep(.25)
        ttl += .25
    if ttl == timeout:
        raise Exception("Sorry, cannot connect to jsbridge extension, port %s" % port)
    
    back_channel, bridge = create_network(host, port)
    sleep(.5)
    
    while back_channel.registered is False:
        back_channel.close()
        bridge.close()
        asyncore.socket_map = {}
        sleep(1)
        back_channel, bridge = create_network(host, port)
    
    return back_channel, bridge

class CLI(mozrunner.CLI):
    """Command line interface."""
    
    module = "jsbridge"

    parser_options = copy.copy(mozrunner.CLI.parser_options)
    parser_options[('-D', '--debug',)] = dict(dest="debug", 
                                             action="store_true",
                                             help="Debug mode", 
                                             metavar="JSBRIDGE_DEBUG",
                                             default=False )
    parser_options[('-s', '--shell',)] = dict(dest="shell", 
                                             action="store_true",
                                             help="Start a Python shell",
                                             metavar="JSBRIDGE_SHELL",
                                             default=False )
    parser_options[('-u', '--usecode',)] = dict(dest="usecode", action="store_true",
                                               help="Use code module instead of iPython",
                                               default=False)
    parser_options[('-P', '--port')] = dict(dest="port",
                                            default=None,
                                            type="int",
                                            help="TCP port to run jsbridge on.")

    def __init__(self, *args, **kwargs):
        mozrunner.CLI.__init__(self, *args, **kwargs)

        self.port = self.options.port or find_port()

    def get_profile(self, *args, **kwargs):
        if self.options.debug:
            kwargs.setdefault('preferences', {}).update({
              'extensions.checkCompatibility':False,
              'devtools.errorconsole.enabled':True,
              'javascript.options.strict': True
            })
        profile = mozrunner.CLI.get_profile(self, *args, **kwargs)
        profile.install_addon(extension_path)
        return profile

    def run(self):
        runner = self.create_runner()

        if self.options.debug and not '-jsconsole' in runner.cmdargs:
            runner.cmdargs.append('-jsconsole')

        if not '-jsbridge' in runner.cmdargs:
            runner.cmdargs += ['-jsbridge', '%s' % self.port]

        runner.start()
        self.start_jsbridge_network()
        if self.options.shell:
            self.start_shell(runner)
        else:
            try:
                runner.wait()
            except KeyboardInterrupt:
                runner.stop()
                
        runner.profile.cleanup()
    
    def start_shell(self, runner):
        try:
            import IPython
        except:
            IPython = None
        if not hasattr(self, 'bridge'):
            self.start_jsbridge_network()
        jsobj = JSObject(self.bridge, window_string)
        
        if IPython is None or self.options.usecode:
            import code
            code.interact(local={"jsobj":jsobj, 
                                 "getBrowserWindow":lambda : getBrowserWindow(self.bridge),
                                 "back_channel":self.back_channel,
                                 })
        else:
            from IPython.Shell import IPShellEmbed
            ipshell = IPShellEmbed([])
            ipshell(local_ns={"jsobj":jsobj, 
                              "getBrowserWindow":lambda : getBrowserWindow(self.bridge),
                              "back_channel":self.back_channel,
                              })
        runner.stop()

    def start_jsbridge_network(self, timeout=10):
        port = int(self.port)
        host = '127.0.0.1'
        self.back_channel, self.bridge = wait_and_create_network(host, port, timeout)

def cli():
    CLI().run()

def getBrowserWindow(bridge):
    return JSObject(bridge, "Components.classes['@mozilla.org/appshell/window-mediator;1'].getService(Components.interfaces.nsIWindowMediator).getMostRecentWindow('')")
    






