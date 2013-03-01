# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this file,
# You can obtain one at http://mozilla.org/MPL/2.0/.

import asyncore
import socket
import os
import sys

from time import sleep
from datetime import datetime, timedelta
from network import Bridge, BackChannel, create_network
from jsobjects import JSObject

parent = os.path.abspath(os.path.dirname(__file__))
extension_path = os.path.join(parent, 'extension')
wait_to_create_timeout = 60


def find_port():
    free_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    free_socket.bind(('127.0.0.1', 0))
    port = free_socket.getsockname()[1]
    free_socket.close()

    return port


def wait_and_create_network(host, port, timeout=wait_to_create_timeout):
    deadline = datetime.utcnow() + timedelta(seconds=timeout)
    connected = False

    while datetime.utcnow() < deadline:
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.connect((host, port))
            s.close()
            connected = True
            break
        except socket.error:
            pass
        sleep(.25)
    if not connected:
        raise Exception("Cannot connect to jsbridge extension, port %s" % port)

    back_channel, bridge = create_network(host, port)
    sleep(.5)

    while back_channel.registered is False:
        back_channel.close()
        bridge.close()
        asyncore.socket_map = {}
        sleep(1)
        back_channel, bridge = create_network(host, port)

    return back_channel, bridge
