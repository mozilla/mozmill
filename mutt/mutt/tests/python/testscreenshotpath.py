#!/usr/bin/env python

import os
import unittest
import tempfile
import uuid

import mozmill


class ScreenshotPathTest(unittest.TestCase):

    test = """
        var setupModule = function () {
          controller = mozmill.getBrowserController();
        }

        let test = function() {
          var backButton = new elementslib.ID(controller.window.document, 'back-button');
          controller.screenshot(backButton, '%(screenshot_name)s', true);
        }
        """

    def make_test(self, screenshot_name):
        """make an example test to run"""
        fd, path = tempfile.mkstemp()
        os.write(fd, self.test % dict(screenshot_name=screenshot_name))
        os.close(fd)
        return path

    def test_screenshot_with_path(self):
        screenshot_name = str(uuid.uuid4())
        test_path = self.make_test(screenshot_name)
        screenshots_path = tempfile.gettempdir()
        m = mozmill.MozMill.create(screenshots_path=screenshots_path)
        m.run([dict(path=test_path)])
        results = m.finish()
        screenshots = results.screenshots

        assert len(screenshots) == 1
        screenshot = os.path.join(screenshots_path, '%s.jpg' % screenshot_name)
        assert screenshots[0]['filename'] == screenshot
        assert os.path.isfile(screenshot)
        os.remove(screenshot)

    def test_screenshot_without_path(self):
        screenshot_name = str(uuid.uuid4())
        test_path = self.make_test(screenshot_name)
        m = mozmill.MozMill.create()
        m.run([dict(path=test_path)])
        results = m.finish()
        screenshots = results.screenshots

        assert len(screenshots) == 1
        screenshots_path_suffix = os.path.join('mozmill_screenshots', '%s.jpg' % screenshot_name)
        assert tempfile.gettempdir() not in screenshots[0]['filename']
        assert screenshots[0]['filename'].endswith(screenshots_path_suffix)
        assert os.path.isfile(screenshots[0]['filename'])
        os.remove(screenshots[0]['filename'])

if __name__ == '__main__':
    unittest.main()
