# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, you can obtain one at http://mozilla.org/MPL/2.0/.

from cStringIO import StringIO
import os
import sys
import tempfile
import unittest

import mozmill
from mozmill.logger import LoggerListener


class ModuleTest(unittest.TestCase):
    def make_test(self):
        """make an example test to run"""
        test = """var test_something = function() {}"""
        fd, path = tempfile.mkstemp()
        os.write(fd, test)
        os.close(fd)

        return path

    def do_test(self, relative_test_path):
        testpath = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                                relative_test_path)
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
        self.path = self.make_test()
        results = self.do_test(self.path)

        self.assertEqual(sys.getrefcount(results), 2,
                         "Only a single reference to results exists")

    def tearDown(self):
        os.remove(self.path)

if __name__ == '__main__':
    unittest.main()
