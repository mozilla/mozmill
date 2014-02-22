# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, you can obtain one at http://mozilla.org/MPL/2.0/.

import os

from .errors import *
from .jsbridge import find_port, wait_and_create_network
from .jsobjects import JSObject


parent = os.path.abspath(os.path.dirname(__file__))
extension_path = os.path.join(parent, 'extension')
