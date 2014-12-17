#!/usr/bin/env python

# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, you can obtain one at http://mozilla.org/MPL/2.0/.

import os
import unittest

from mozprocess import ProcessHandler

class TestPref(unittest.TestCase):
    """Test the --pref option."""

    def test_pref(self):
        absdir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        testdir = os.path.join(absdir, 'js-modules')

        process = ProcessHandler(['mozmill',
                                  '-b', os.environ['BROWSER_PATH'],
                                  '-t', os.path.join(testdir,
                                                     'useMozmill',
                                                     'testPref.js'),
                                  '--pref=abc:123'
                                 ],
                                 # stop mozmill from printing output to console
                                 processOutputLine=[lambda line: None])
        process.run()
        process.wait()

        self.assertEqual(process.proc.poll(), 0, 'Test passed')

if __name__ == '__main__':
    unittest.main()
