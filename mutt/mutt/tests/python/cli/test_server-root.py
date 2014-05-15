#!/usr/bin/env python

# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, you can obtain one at http://mozilla.org/MPL/2.0/.

import os
import subprocess
import unittest

from mozprocess import ProcessHandler

here = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
testdir = os.path.join(here, 'js-modules')


class TestServerRootOption(unittest.TestCase):
    """Test the --server-root option."""

    def test_option(self):
        process = ProcessHandler(['mozmill',
                                  '-b', os.environ['BROWSER_PATH'],
                                  '-t', os.path.join(testdir,
                                                     'useMozmill',
                                                     'testServerRoot.js'),
                                  '--server-root', os.path.join(testdir,
                                                                '../../data'),
                                  ],
                                 # stop mozmill from printing output to console
                                 processOutputLine=[lambda line: None])
        process.run()
        process.wait()

        self.assertEqual(process.proc.poll(), 0,
                         'Test was run successful')

    def test_no_option(self):
        process = ProcessHandler(['mozmill',
                                  '-b', os.environ['BROWSER_PATH'],
                                  '-t', os.path.join(testdir,
                                                     'useMozmill',
                                                     'testServerRoot.js')
                                  ],
                                 # stop mozmill from printing output to console
                                 processOutputLine=[lambda line: None])
        process.run()
        process.wait()

        self.assertEqual(process.proc.poll(), 1,
                         'Test failed')


if __name__ == '__main__':
    unittest.main()
