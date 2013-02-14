import os
import unittest

import manifestparser
import mozmill


class ModuleEndTest(unittest.TestCase):
    """Bug 771517: User restart tests do no longer report final test result"""
    def test_modules(self):
        manifest = manifestparser.TestManifest(
            manifests=[os.path.join(os.path.dirname(os.path.abspath(__file__)),
                                    "js-tests",
                                    "restart_endtest",
                                    "tests.ini")],
            strict=False)

        m = mozmill.MozMill.create()
        m.run(manifest.active_tests())
        results = m.finish()

        # From the first test, there is one passing test
        self.assertEqual(len(results.passes), 3, "Passes should match")
        self.assertEqual(len(results.fails), 0, "Fails should match")
        self.assertEqual(len(results.skipped), 0, "Skips should match")

if __name__ == '__main__':
    unittest.main()
