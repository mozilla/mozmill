import os
import unittest
import tempfile

import mozmill


class ModuleTest(unittest.TestCase):
    def make_test(self):
        """make an example test to run"""
        test = """var test_something = function() {}"""
        fd, path = tempfile.mkstemp()
        os.write(fd, test)
        os.close(fd)

        return path

    def test_appinfo(self):
        tests = [{'path': self.make_test()}]

        m = mozmill.MozMill.create()
        results = m.run(tests)
        results.finish(())

        self.assertRegexpMatches(results.appinfo.get('application_id'), "^{.*}$")
        self.assertIsInstance(results.appinfo.get('application_name'), unicode)
        self.assertIsInstance(results.appinfo.get('application_version'), unicode)
        self.assertIsInstance(results.appinfo.get('application_locale'), unicode)
        self.assertRegexpMatches(results.appinfo.get('platform_buildid'), "^[0-9]*$")
        self.assertIsInstance(results.appinfo.get('application_version'), unicode)
        self.assertIsInstance(results.appinfo.get('startupinfo'), dict)

        addons = results.appinfo.get('addons')
        self.assertIsInstance(addons, list)
        self.assertGreaterEqual(len(addons), 2,
                                "At least Mozmill and JSBridge should be installed.")


if __name__ == '__main__':
    unittest.main()
