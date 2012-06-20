#!/usr/bin/env python

import subprocess
import os
import unittest

class TestManifestTestsOptions(unittest.TestCase):
    """Ensure that tests and manifests cannot be specified at the same time."""

    def test_options(self):
        absdir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

        retval = subprocess.call(['mozmill',
                                  '-b', os.environ['BROWSER_PATH'],
                                  '-t', os.path.join(absdir, 'js-tests', 'test_module1.js'),
                                  '-m', os.path.join(absdir, 'js-tests', 'example.ini')
                                 ])
        self.assertEqual(retval, 2, 'Parser error due to -t and -m are mutually exclusive')

if __name__ == '__main__':
    unittest.main()
