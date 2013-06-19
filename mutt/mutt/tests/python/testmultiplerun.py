#!/usr/bin/env python

# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, you can obtain one at http://mozilla.org/MPL/2.0/.

import mozmill
import os
import tempfile
import unittest


class TestMozmillAPI(unittest.TestCase):
    """test mozmill's API"""

    def make_test(self):
        """make an example test to run"""
        test = """var test_something = function() {}"""
        fd, path = tempfile.mkstemp()
        os.write(fd, test)
        os.close(fd)
        return path

    def test_runtwice(self):
        passes = 2
        self.path = self.make_test()

        m = mozmill.MozMill.create()
        m.run([dict(path=self.path)])
        m.run([dict(path=self.path)])
        results = m.finish()

        self.assertTrue(len(results.passes) == passes)

    def tearDown(self):
        os.remove(self.path)

if __name__ == '__main__':
    unittest.main()
