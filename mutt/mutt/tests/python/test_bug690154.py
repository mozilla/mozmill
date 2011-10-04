#!/usr/bin/env python

import mozmill
import os
import tempfile
import unittest

class TestBug690154(unittest.TestCase):
    """
    JSON structure when test throws a global exception:
    https://bugzilla.mozilla.org/show_bug.cgi?id=690154
    """

    def make_test(self):
        """make an example test to run"""
        test = """1 = foo""" # something deliberately bad
        fd, path = tempfile.mkstemp()
        os.write(fd, test)
        os.close(fd)
        return path

    def test_JSON_structure(self):
        passes = 1
        path = self.make_test()
        m = mozmill.MozMill.create()
        results = m.run(dict(path=path))
        self.assertFalse(results.passes) # no modules pass
        self.assertTrue(len(results.fails) == 1) # one module fails
        fails = results.fails[0]
        self.assertFalse(fails['passes']) # no functions pass
        self.assertTrue(len(fails['fails']) == 1) # a single failure at the module level
        failure = fails['fails'][0]
        self.assertTrue('exception' in failure)
        self.assertTrue(fails['name'] == '<TOP_LEVEL>')

if __name__ == '__main__':
    unittest.main()
