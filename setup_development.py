#!/usr/bin/env python

# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, you can obtain one at http://mozilla.org/MPL/2.0/.

PACKAGES = ['jsbridge', 'mozmill', 'mutt']

import os
import subprocess
import sys

path = os.path.dirname(os.path.abspath(__file__))

for package in PACKAGES:
    os.chdir(os.path.join(path, package))
    subprocess.call([sys.executable, "setup.py", "develop"])
