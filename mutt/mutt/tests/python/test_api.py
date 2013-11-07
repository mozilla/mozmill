#!/usr/bin/env python

# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, you can obtain one at http://mozilla.org/MPL/2.0/.

import mozmill
import os
import tempfile
import unittest


class TestMozmillAPI(unittest.TestCase):
    """Several tests for Mozmill API"""

    def setUp(self):
        self.test = self.make_test()

    def tearDown(self):
        os.remove(self.test)

    def make_test(self):
        """make an example test to run"""
        test = """function test() { assert.ok(true); }"""
        fd, path = tempfile.mkstemp()
        os.write(fd, test)
        os.close(fd)

        return path

    def test_basic(self):
        m = mozmill.MozMill.create()
        m.run([dict(path=self.test)])
        results = m.finish()

        self.assertEqual(len(results.passes), 1)

    def test_create_args_by_reference(self):
        profile_args = dict(addons=[])
        runner_args = dict(cmdargs=[])

        m = mozmill.MozMill.create(profile_args=profile_args,
                                   runner_args=runner_args)
        m.run([dict(path=self.test)])
        m.finish()

        self.assertEqual(profile_args, dict(addons=[]))
        self.assertEqual(runner_args, dict(cmdargs=[]))

if __name__ == '__main__':
    unittest.main()
