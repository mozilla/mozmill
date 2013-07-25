#!/usr/bin/python
# -*- coding: UTF-8 -*-

# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, you can obtain one at http:#mozilla.org/MPL/2.0/.

import os
import unittest

import mozmill


class TestAddons(unittest.TestCase):

    def do_test(self, test_path=None, manifest_path=None, persisted=None,
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
        if persisted:
            m.persisted.update(persisted)
        m.run(tests)
        results = m.finish(())

        # From the first test, there is one passing test
        self.assertEqual(len(results.passes), passes, 'Passes should match')
        self.assertEqual(len(results.fails), fails, 'Fails should match')
        self.assertEqual(len(results.skipped), skips, 'Skips should match')

        return (results, m.persisted)

    def test_addon_list(self):
        testpath = os.path.join('js-modules', 'testAddons.js')
        results, persisted = self.do_test(test_path=testpath,
                                          passes=1)

        self.assertEqual(persisted['addons'], results.appinfo['addons'],
                         "List of add-ons has been correctly transferred.")


if __name__ == '__main__':
    unittest.main()
