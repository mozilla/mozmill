#!/usr/bin/env python

# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, you can obtain one at http://mozilla.org/MPL/2.0/.

import os
import unittest
import tempfile
import uuid

import mozfile
import mozmill


class ScreenshotPathTest(unittest.TestCase):

    def setUp(self):
        self.screenshot_name = str(uuid.uuid4())
        self.screenshots_path = None

        self.persisted = {"screenshotName": self.screenshot_name}

    def do_test(self, screenshots_path="", persisted=None):
        abspath = os.path.dirname(os.path.abspath(__file__))
        testpath = os.path.join("js-modules", "testScreenshotPath.js")
        testpath = os.path.join(abspath, testpath)

        tests = [{'path': testpath}]

        m = mozmill.MozMill.create(screenshots_path=screenshots_path)
        if persisted:
            m.persisted.update(persisted)
        m.run(tests)
        results = m.finish()

        return results

    def test_screenshot_with_custom_path(self):
        self.screenshots_path = tempfile.mkdtemp()
        results = self.do_test(self.screenshots_path, self.persisted)
        screenshot = results.screenshots[0]['filename']

        self.assertEqual(len(results.screenshots), 1)
        self.assertTrue(os.path.isfile(screenshot))

        wanted_screenshot = os.path.join(self.screenshots_path,
                                         '%s.jpg' % self.screenshot_name)
        self.assertEqual(wanted_screenshot, screenshot)
        self.assertTrue(os.path.isfile(screenshot))

    def test_screenshot_without_custom_path(self):
        results = self.do_test(persisted=self.persisted)
        screenshot = results.screenshots[0]['filename']

        self.assertEqual(len(results.screenshots), 1)
        self.assertTrue(os.path.isfile(screenshot))

        self.screenshots_path = os.path.dirname(screenshot)
        self.assertIn(tempfile.gettempdir(), screenshot)

    def tearDown(self):
        mozfile.remove(self.screenshots_path)


if __name__ == '__main__':
    unittest.main()
