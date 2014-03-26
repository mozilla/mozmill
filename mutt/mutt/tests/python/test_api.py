#!/usr/bin/env python

# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, you can obtain one at http://mozilla.org/MPL/2.0/.

import mozmill
import os
import unittest


class TestMozmillAPI(unittest.TestCase):
    """Several tests for Mozmill API"""

    def do_test(self, relative_test_path, profile_args=None, runner_args=None):
        abspath = os.path.dirname(os.path.abspath(__file__))
        testpath = os.path.join(abspath, relative_test_path)
        tests = [{'path': testpath}]

        m = mozmill.MozMill.create(profile_args=profile_args,
                                   runner_args=runner_args)
        m.run(tests)
        m.finish()

        return m.results

    def test_basic(self):
        testpath = os.path.join("js-modules", "newEmptyFunction.js")
        results = self.do_test(testpath)

        self.assertEqual(len(results.passes), 1)

    def test_create_args_by_reference(self):
        testpath = os.path.join("js-modules", "newEmptyFunction.js")
        profile_args = dict(addons=[])
        runner_args = dict(cmdargs=[])

        self.do_test(testpath, profile_args, runner_args)

        self.assertEqual(profile_args, dict(addons=[]))
        self.assertEqual(runner_args, dict(cmdargs=[]))

if __name__ == '__main__':
    unittest.main()
