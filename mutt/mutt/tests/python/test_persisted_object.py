#!/usr/bin/env python

# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, you can obtain one at http://mozilla.org/MPL/2.0/.

import mozmill
import os
import unittest


class TestMozmillPersisted(unittest.TestCase):
    """test persisted object"""

    def do_test(self, relative_test_path):
        abspath = os.path.dirname(os.path.abspath(__file__))
        testpath = os.path.join(abspath, relative_test_path)
        tests = [{'path': testpath}]

        m = mozmill.MozMill.create()

        m.persisted['bar'] = 'foo'
        m.persisted['foo'] = 'bar'
        m.persisted['number'] = 1

        m.run(tests)
        results = m.finish()

        self.assertEqual(len(results.passes), 1)

        # inspect the persisted data following the test
        self.assertEqual(m.persisted['fleem'], 2)
        self.assertEqual(m.persisted['bar'], 'bar')
        self.assertEqual(m.persisted['number'], 2)
        self.assertFalse('foo' in m.persisted)

    def test_persisted(self):
        testpath = os.path.join("js-modules", "testPersisted.js")
        self.do_test(testpath)

    def test_persisted_shutdown(self):
        testpath = os.path.join("js-modules", "testPersistedShutdown.js")
        self.do_test(testpath)


if __name__ == '__main__':
    unittest.main()
