#!/usr/bin/env python

# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, you can obtain one at http://mozilla.org/MPL/2.0/.

import subprocess
import os
import unittest

from mozprocess import ProcessHandler

class TestManifestTestsOptions(unittest.TestCase):
    """Ensure that tests and manifests cannot be specified at the same time."""

    def test_options(self):
        absdir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        testdir = os.path.join(absdir, 'js-tests')

        process = ProcessHandler(['mozmill',
                                  '-b', os.environ['BROWSER_PATH'],
                                  '-t', os.path.join(testdir,
                                                     'test_module1.js'),
                                  '-m', os.path.join(testdir, 'example.ini')
                                 ])
        process.run()
        process.waitForFinish()

        self.assertNotEqual(process.proc.poll(), 0,
                            'Parser error due to -t and -m are mutually exclusive')

if __name__ == '__main__':
    unittest.main()
