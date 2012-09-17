import os
import tempfile
import unittest
import mozmill
import sys

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

        logger = LoggerListener(console_level="ERROR")

        m = mozmill.MozMill.create(handlers=(logger,))
        m.run(tests)
        results = m.finish()

        self.assertEqual(sys.getrefcount(logger), 2,
                         "Only a single reference to the logger exists")
        self.assertEqual(sys.getrefcount(m), 2,
                         "Only a single reference to mozmill exists")

        return results

    def test_modules(self):
        results = self.do_test(self.make_test())

        self.assertEqual(sys.getrefcount(results), 2,
                         "Only a single reference to results exists")

if __name__ == '__main__':
    unittest.main()
