#!/usr/bin/env python

# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, you can obtain one at http://mozilla.org/MPL/2.0/.

import mozmill
import os
import unittest


class TestMozmillAPI(unittest.TestCase):
    """test mozmill's API"""

    def do_test(self, relative_test_path, passes=0):
        abspath = os.path.dirname(os.path.abspath(__file__))
        testpath = os.path.join(abspath, relative_test_path)
        tests = [{'path': testpath}]

        m = mozmill.MozMill.create()
        m.run(tests)
        m.run(tests)
        results = m.finish()

        self.assertEqual(len(results.passes), passes)

    def test_runtwice(self):
        testpath = os.path.join("js-modules", "newEmptyFunction.js")
        self.do_test(testpath, passes=2)

if __name__ == '__main__':
    unittest.main()
