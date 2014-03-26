# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, you can obtain one at http://mozilla.org/MPL/2.0/.

from cStringIO import StringIO
import os
import sys
import unittest

import mozmill
from mozmill.logger import LoggerListener


class ModuleTest(unittest.TestCase):

    def do_test(self, relative_test_path):
        abspath = os.path.dirname(os.path.abspath(__file__))
        testpath = os.path.join(abspath, relative_test_path)
        tests = [{'path': testpath}]

        info_data = StringIO()
        logger = LoggerListener(console_level="DEBUG",
                                console_stream=info_data)

        m = mozmill.MozMill.create(handlers=[logger])
        m.run(tests)
        results = m.finish()

        self.assertEqual(sys.getrefcount(logger), 2,
                         "Only a single reference to the logger exists")
        self.assertEqual(sys.getrefcount(m), 2,
                         "Only a single reference to mozmill exists")

        return results

    def test_modules(self):
        testpath = os.path.join("js-modules", "newEmptyFunction.js")
        results = self.do_test(testpath)

        self.assertEqual(sys.getrefcount(results), 2,
                         "Only a single reference to results exists")

if __name__ == '__main__':
    unittest.main()
