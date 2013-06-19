# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, you can obtain one at http://mozilla.org/MPL/2.0/.

import os
import unittest

import mozmill


class ModuleTest(unittest.TestCase):
    def test_modules(self):
        testpath = os.path.join("js-tests", "test_module1.js")
        self.do_test(testpath, passes=1, fails=0, skips=0)

        testpath = os.path.join("js-tests", "test_module2.js")
        self.do_test(testpath, passes=0, fails=1, skips=0)

        testpath = os.path.join("js-tests", "test_module3.js")
        self.do_test(testpath, passes=0, fails=0, skips=1)

    def do_test(self, relative_test_path, passes=0, fails=0, skips=0):
        testpath = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                                relative_test_path)
        tests = [{'path': testpath}]

        m = mozmill.MozMill.create()
        m.run(tests)
        results = m.finish(())

        # From the first test, there is one passing test
        self.assertEqual(len(results.passes), passes, "Passes should match")
        self.assertEqual(len(results.fails), fails, "Fails should match")
        self.assertEqual(len(results.skipped), skips, "Skips should match")

if __name__ == '__main__':
    unittest.main()
