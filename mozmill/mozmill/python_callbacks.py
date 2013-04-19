# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, you can obtain one at http://mozilla.org/MPL/2.0/.

"""
python callbacks handler for mozmill
"""

import imp
import os


class PythonCallbacks(object):
    """Fire python callbacks from JS; these are one-way only."""

    def __init__(self):
        pass

    def events(self):
        return {'mozmill.firePythonCallback': self.fire}

    def fire(self, obj):
        try:
            path = os.path.dirname(obj['test'])
            path = os.path.join(path, obj['filename'])

            assert_msg = "PythonCallbacks: file does not exist: %s"
            assert os.path.exists(path), assert_msg % obj['filename']

            module = imp.load_source('callbacks', path)
            method = getattr(module, obj['method'])
            method(*obj.get('args', []), **obj.get('kwargs', {}))
        except BaseException as e:
            print "PythonCallbacks error:"
            print repr(e)
            raise
