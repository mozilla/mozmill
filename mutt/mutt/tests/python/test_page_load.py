# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, you can obtain one at http://mozilla.org/MPL/2.0/.

import os
import unittest

import mozmill


class TestPageLoad(unittest.TestCase):

    def do_test(self, relative_test_path, passes=0, fails=0, skips=0):
        testpath = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                                relative_test_path)
        tests = [{'path': testpath}]

        m = mozmill.MozMill.create()
        m.run(tests)
        results = m.finish(())

        self.assertEqual(len(results.passes), passes, "Passes should match")
        self.assertEqual(len(results.fails), fails, "Fails should match")
        self.assertEqual(len(results.skipped), skips, "Skips should match")

        return results

    def test_waitforpageload_status(self):
        testpath = os.path.join("js-modules", "testPageLoad.js")
        results = self.do_test(testpath, passes=1, fails=1)

        # Check the last pass of the first test function
        message = results.passes[0]['passes'][-1:][0]['function']
        self.assertIn('URI=', message)
        self.assertIn('readyState=', message)

        # Check the last exception of the second test function
        message = results.fails[0]['fails'][-1:][0]['exception']['message']
        self.assertIn('URI=', message)
        self.assertIn('readyState=', message)

if __name__ == '__main__':
    unittest.main()
