#!/usr/bin/env python

# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, you can obtain one at http://mozilla.org/MPL/2.0/.

import os
import sys
import unittest

import mozmill


here = os.path.dirname(os.path.abspath(__file__))

class TestShutdownUnexpected(unittest.TestCase):

    def test_unexpected_crash(self):
        addons = [os.path.join(here, '..', 'data', 'xpi', 'crashme.xpi')]
        testpath = os.path.join(here, 'js-modules', 'testShutdownUnexpectedCrash.js')

        exit_code, results = self.do_test(testpath, addons, passes=0, fails=1, skips=0)
        self.assertNotIn(exit_code, [None, 0])

    @unittest.skipIf(sys.platform == 'darwin' or sys.platform.startswith("win"),
                     'Bug 794020 - Client disconnect / IO Completion Port failed')
    def test_unexpected_restart(self):
        testpath = os.path.join(here, 'js-modules', 'testShutdownUnexpectedRestart.js')

        exit_code, results = self.do_test(testpath, exception=mozmill.errors.ShutdownError,
                                 passes=0, fails=1, skips=0)
        self.assertNotIn(exit_code, [None, 0])

    def test_unexpected_quit(self):
        testpath = os.path.join(here, 'js-modules', 'testShutdownUnexpectedQuit.js')

        exit_code, results = self.do_test(testpath, passes=0, fails=1, skips=0)
        self.assertEqual(exit_code, 0)

    def do_test(self, testpath, addons=None, exception=None,
                passes=0, fails=0, skips=0):
        addons = addons or []

        m = mozmill.MozMill.create(jsbridge_timeout=10,
                                   profile_args=dict(addons=addons))

        if exception:
            self.assertRaises(mozmill.errors.ShutdownError,
                              m.run, [{'path': testpath}])
        else:
            m.run([{'path': testpath}])

        exit_code = m.runner.returncode
        results = m.finish()

        self.assertEqual(len(results.passes), passes)
        self.assertEqual(len(results.fails), fails)
        self.assertEqual(len(results.skipped), skips)

        return (exit_code, results)

if __name__ == '__main__':
    unittest.main()
