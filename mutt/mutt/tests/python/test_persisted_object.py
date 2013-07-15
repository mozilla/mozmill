#!/usr/bin/env python

# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, you can obtain one at http://mozilla.org/MPL/2.0/.

import mozmill
import os
import tempfile
import unittest


class TestMozmillPersisted(unittest.TestCase):
    """test persisted object"""

    test = """
    var setupModule = function () {
      controller = mozmill.getBrowserController();
    }

    let test = function () {
      persisted.bar = 'bar';
      persisted.fleem = 2;
      persisted.number += 1;

      delete persisted.foo;
      %(shutdown)s
    }
    """

    def make_test(self, shutdown=''):
        """make an example test to run"""
        fd, path = tempfile.mkstemp()
        os.write(fd, self.test % dict(shutdown=shutdown))
        os.close(fd)
        return path

    def test_persisted(self):
        self.path = self.make_test()
        m = mozmill.MozMill.create()
        m.persisted['bar'] = 'foo'
        m.persisted['foo'] = 'bar'
        m.persisted['number'] = 1
        m.run([dict(path=self.path)])
        results = m.finish()

        self.assertTrue(len(results.passes) == 1)
        self.inspect_persisted(m.persisted)

    def test_persisted_shutdown(self):
        self.path = self.make_test(shutdown='controller.stopApplication();')

        m = mozmill.MozMill.create()
        m.persisted['bar'] = 'foo'
        m.persisted['foo'] = 'bar'
        m.persisted['number'] = 1
        m.run([dict(path=self.path)])
        results = m.finish()

        self.assertTrue(len(results.passes) == 1)
        self.inspect_persisted(m.persisted)

    def inspect_persisted(self, persisted):
        """inspect the persisted data following the test"""
        self.assertEqual(persisted['fleem'], 2)
        self.assertEqual(persisted['bar'], 'bar')
        self.assertEqual(persisted['number'], 2)
        self.assertFalse('foo' in persisted)

    def tearDown(self):
        os.remove(self.path)

if __name__ == '__main__':
    unittest.main()
