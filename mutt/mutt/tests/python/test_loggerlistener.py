from cStringIO import StringIO
import os
import sys
import unittest
import tempfile

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

    def test_logger_listener(self):
        tests = [{'path': self.make_test()}]

        info_data= StringIO()
        debug_data = StringIO()

        logger_info = LoggerListener(console_level="INFO", console_stream=info_data)
        logger_debug = LoggerListener(console_level="DEBUG", console_stream=debug_data)

        m = mozmill.MozMill.create(handlers=(logger_info, logger_debug))
        results = m.run(tests)
        results.finish((logger_info, logger_debug))

        assert "TEST-START" in debug_data.getvalue()
        assert "TEST-PASS" in debug_data.getvalue()
        assert "DEBUG" in debug_data.getvalue()

        assert "TEST-START" in debug_data.getvalue()
        assert "TEST-PASS" in debug_data.getvalue()
        assert "DEBUG" not in info_data.getvalue()

if __name__ == '__main__':
    unittest.main()
