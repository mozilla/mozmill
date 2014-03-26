#!/usr/bin/env python

# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, you can obtain one at http://mozilla.org/MPL/2.0/.

import mozmill
import os
import unittest


class TestBug690154(unittest.TestCase):
    """
    JSON structure when test throws a global exception:
    https://bugzilla.mozilla.org/show_bug.cgi?id=690154
    """

    def do_test(self, relative_test_path, passes=0):
        abspath = os.path.dirname(os.path.abspath(__file__))
        testpath = os.path.join(abspath, relative_test_path)
        tests = [{'path': testpath}]

        m = mozmill.MozMill.create()
        m.run(tests)
        results = m.finish(())

        # no modules pass
        self.assertFalse(results.passes)
        # one module fails
        self.assertTrue(len(results.fails) == 1)

        fails = results.fails[0]
        # no functions pass
        self.assertFalse(fails['passes'])
        # a single failure at the module level
        self.assertTrue(len(fails['fails']) == 1)

        failure = fails['fails'][0]
        self.assertTrue('exception' in failure)
        self.assertTrue(fails['name'] == '<TOP_LEVEL>')

    def test_JSON_structure(self):
        testpath = os.path.join("js-modules", "testThrowGlobalException.js")
        self.do_test(testpath, passes=1)


if __name__ == '__main__':
    unittest.main()
