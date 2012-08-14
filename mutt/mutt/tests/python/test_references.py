import os
import tempfile
import unittest
import mozmill
import sys

from mozmill.logger import LoggerListener


class ModuleTest(unittest.TestCase):
    def test_modules(self):
        testpath = os.path.join("js-tests", "test_module1.js")
        self.do_test(testpath)

    def do_test(self, relative_test_path):
        testpath = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                                relative_test_path)
        tests = [{'path': testpath}]

        log_file = tempfile.mktemp(suffix='.txt')
        logger = LoggerListener(log_file=log_file,
                                file_level="DEBUG", debug=True)

        m = mozmill.MozMill.create(handlers=(logger,))
        m.run(tests)
        results = m.finish()

        self.assertEqual(sys.getrefcount(logger), 2, "References to the logger handler have been cleaned-up")
        self.assertEqual(sys.getrefcount(results), 2, "References to results have been cleaned-up")
        self.assertEqual(sys.getrefcount(m), 4, "Mozmill has references to the logger and results")

if __name__ == '__main__':
    unittest.main()
