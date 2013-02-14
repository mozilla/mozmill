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
        test = """1 = foo"""
        fd, path = tempfile.mkstemp()
        os.write(fd, test)
        os.close(fd)
        return path

    def test_JSON_structure(self):
        passes = 1
        self.path = self.make_test()
        print self.path

        m = mozmill.MozMill.create()
        m.run([dict(path=self.path)])
        results = m.finish()

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

    def tearDown(self):
        os.remove(self.path)

if __name__ == '__main__':
    unittest.main()
