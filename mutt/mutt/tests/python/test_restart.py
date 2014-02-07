# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, you can obtain one at http://mozilla.org/MPL/2.0/.

import os
import unittest

import manifestparser
import mozmill


class TestRestartTests(unittest.TestCase):

    def do_test(self, test_path=None, manifest_path=None,
                passes=0, fails=0, skips=0):

        abspath = os.path.dirname(os.path.abspath(__file__))

        if manifest_path:
            manifestpath = os.path.join(abspath, manifest_path)
            manifest = manifestparser.TestManifest(manifests=[manifestpath], strict=False)
            tests = manifest.active_tests()
        elif test_path:
            testpath = os.path.join(abspath, test_path)
            tests = [{'path': testpath}]

        m = mozmill.MozMill.create()
        m.run(tests)
        results = m.finish(())

        # From the first test, there is one passing test
        self.assertEqual(len(results.passes), passes, "Passes should match")
        self.assertEqual(len(results.fails), fails, "Fails should match")
        self.assertEqual(len(results.skipped), skips, "Skips should match")

        return (results, m.persisted)

    def test_failures_with_restart(self):
        testpath = os.path.join("js-modules", "restartTests", "testCountTestFailures.js")
        self.do_test(test_path=testpath, fails=3)

    def test_passes_with_restart(self):
        testpath = os.path.join("js-modules", "restartTests", "testCountTestPasses.js")
        self.do_test(test_path=testpath, passes=3)

    def test_restart_then_shutdown(self):
        manifestpath = os.path.join("js-modules", "test_shutdownAfterRestart", "manifest.ini")
        self.do_test(manifest_path=manifestpath, passes=3)

    def test_skipped_with_restart(self):
        testpath = os.path.join("js-modules", "restartTests", "testCountTestSkipped.js")
        self.do_test(test_path=testpath, skips=4)

    def test_state_machine(self):
        expected_states = ['setupModule', 'setupTest', 'testFirst', 'teardownTest',
                           'setupTest', 'testThird', 'teardownTest', 'setupTest',
                           'testSecond', 'teardownTest']

        testpath = os.path.join("js-modules", "restartTests", "testStateMachine.js")
        results, persisted = self.do_test(test_path=testpath, passes=3)

        self.assertEqual(persisted["seen_states"], expected_states,
                         'All states have been recorded in the correct order')


if __name__ == '__main__':
    unittest.main()
