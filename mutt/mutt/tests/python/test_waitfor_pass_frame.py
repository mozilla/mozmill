#!/usr/bin/env python

# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, you can obtain one at http://mozilla.org/MPL/2.0/.

import os
import unittest

import mozmill


class TestBug795579(unittest.TestCase):
    """Bug 795579: waitFor method doesn't send a pass frame
    which can cause an application disconnect when handled in a loop
    """

    jsbridge_timeout = 5.

    def test_waitfor_send_pass_frame(self):
        testpath = os.path.join("js-modules", "testWaitForPassFrame.js")
        self.do_test(testpath, passes=2, fails=0, skips=0)

    def do_test(self, relative_test_path, passes=0, fails=0, skips=0):
        testpath = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                                relative_test_path)
        tests = [{'path': testpath}]

        m = mozmill.MozMill.create(jsbridge_timeout=self.jsbridge_timeout)
        m.run(tests)
        results = m.finish()

        self.assertEqual(len(results.passes), passes)
        self.assertEqual(len(results.fails), fails)
        self.assertEqual(len(results.skipped), skips)

if __name__ == '__main__':
    unittest.main()
