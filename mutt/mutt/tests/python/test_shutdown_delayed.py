#!/usr/bin/env python

# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, you can obtain one at http://mozilla.org/MPL/2.0/.

import os
import unittest

import mozmill


TIMEOUT = 7.


class TestBug1009224(unittest.TestCase):
    """Bug 1009224
    sleep() and waitFor() keeps Firefox running, even it should quit

    """
    def test_sleep_after_quit(self):
        persisted = {'waitTime': TIMEOUT * 1000}

        testpath = os.path.join("js-modules", "testShutdown_sleep.js")
        results = self.do_test(testpath, persisted, passes=1, fails=1, skips=0)

        import datetime
        time = results.passes[-1]['time_end'] / 1000
        time = datetime.datetime.utcfromtimestamp(time)

        self.assertTrue((results.endtime - time).seconds < TIMEOUT)

    def test_waitfor_after_quit(self):
        persisted = {'waitTime': TIMEOUT * 1000}

        testpath = os.path.join("js-modules", "testShutdown_waitFor.js")
        results = self.do_test(testpath, persisted, passes=1, fails=1, skips=0)

        import datetime
        time = results.passes[-1]['time_end'] / 1000
        time = datetime.datetime.utcfromtimestamp(time)

        self.assertTrue((results.endtime - time).seconds < TIMEOUT)

    def do_test(self, relative_test_path, persisted=None,
                passes=0, fails=0, skips=0):
        testpath = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                                relative_test_path)
        tests = [{'path': testpath}]

        m = mozmill.MozMill.create()
        if persisted:
            m.persisted.update(persisted)
        m.run(tests)
        results = m.finish()

        self.assertEqual(len(results.passes), passes)
        self.assertEqual(len(results.fails), fails)
        self.assertEqual(len(results.skipped), skips)

        return results

if __name__ == '__main__':
    unittest.main()
