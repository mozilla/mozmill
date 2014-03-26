# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, you can obtain one at http://mozilla.org/MPL/2.0/.

from cStringIO import StringIO
import os
import unittest

import mozmill
from mozmill.logger import LoggerListener


class ModuleTest(unittest.TestCase):

    def do_test(self, relative_test_path):
        abspath = os.path.dirname(os.path.abspath(__file__))
        testpath = os.path.join(abspath, relative_test_path)
        tests = [{'path': testpath}]

        info_data = StringIO()
        debug_data = StringIO()

        logger_info = LoggerListener(console_level="INFO",
                                     console_stream=info_data)
        logger_debug = LoggerListener(console_level="DEBUG",
                                      console_stream=debug_data)

        m = mozmill.MozMill.create(handlers=[logger_info, logger_debug])
        m.run(tests)
        m.finish()

        self.assertIn("TEST-START", debug_data.getvalue())
        self.assertIn("TEST-PASS", debug_data.getvalue())
        self.assertIn("DEBUG", debug_data.getvalue())

        self.assertIn("TEST-START", debug_data.getvalue())
        self.assertIn("TEST-PASS", debug_data.getvalue())
        self.assertNotIn("DEBUG", info_data.getvalue())

    def test_logger_listener(self):
        testpath = os.path.join("js-modules", "newEmptyFunction.js")
        self.do_test(testpath)

if __name__ == '__main__':
    unittest.main()
