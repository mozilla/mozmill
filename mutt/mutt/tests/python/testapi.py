#!/usr/bin/env python

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

    def test_api(self):
        passes = 1
        path = self.make_test()

        m = mozmill.MozMill.create()
        m.run([dict(path=path)])
        results = m.finish()

        self.assertTrue(len(results.passes) == passes)

if __name__ == '__main__':
    unittest.main()
