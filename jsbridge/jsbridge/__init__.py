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
# Portions created by the Initial Developer are Copyright (C) 2008 -2009
# the Initial Developer. All Rights Reserved.
# 
# Contributor(s):
#  Mikeal Rogers <mikeal.rogers@gmail.com>
#  Henrik Skupin <hskupin@mozilla.com>
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

import asyncore
import socket
import os
import sys

from time import sleep
from network import Bridge, BackChannel, create_network
from jsobjects import JSObject

parent = os.path.abspath(os.path.dirname(__file__))
extension_path = os.path.join(parent, 'extension')
wait_to_create_timeout = 60

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
