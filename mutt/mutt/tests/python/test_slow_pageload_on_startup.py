# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, you can obtain one at http://mozilla.org/MPL/2.0/.

import os
import unittest

import manifestparser
import mozmill


class TestPageLoad(unittest.TestCase):

    def test_slow_pageload_on_startup(self):
        manifestpath = os.path.join("js-modules",
                                    "manifest_testPageLoadOnStartup.ini")
        self.do_test(manifestpath, passes=1)

    def do_test(self, relative_manifest_path, passes=0, fails=0, skips=0):
        manifestpath = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                                    relative_manifest_path)
        manifest = manifestparser.TestManifest(
            manifests=[manifestpath], strict=False)
        tests = manifest.active_tests()

        runner_args = {'cmdargs': ['http://www.nbc.com']}

        m = mozmill.MozMill.create(runner_args=runner_args)
        m.run(tests)
        results = m.finish(())

        # From the first test, there is one passing test
        self.assertEqual(len(results.passes), passes, "Passes should match")
        self.assertEqual(len(results.fails), fails, "Fails should match")
        self.assertEqual(len(results.skipped), skips, "Skips should match")

if __name__ == '__main__':
    unittest.main()
