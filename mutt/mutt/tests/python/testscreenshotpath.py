#!/usr/bin/env python

import os
import unittest
import shutil
import tempfile
import uuid

import mozmill


class ScreenshotPathTest(unittest.TestCase):

    test = """
        var setupModule = function () {
          controller = mozmill.getBrowserController();
        }

        let test = function() {
          var backButton = findElement.ID(controller.window.document, 'back-button');
          controller.screenshot(backButton, '%(screenshot_name)s', true);
        }
        """

    def make_test(self, screenshot_name):
        """make an example test to run"""
        fd, path = tempfile.mkstemp()
        os.write(fd, self.test % dict(screenshot_name=screenshot_name))
        os.close(fd)
        return path

    def test_screenshot_with_custom_path(self):
        screenshot_name = str(uuid.uuid4())
        self.path = self.make_test(screenshot_name)
        self.screenshots_path = tempfile.mkdtemp()
        m = mozmill.MozMill.create(screenshots_path=self.screenshots_path)
        m.run([dict(path=self.path)])
        results = m.finish()
        screenshots = results.screenshots

        assert len(screenshots) == 1
        screenshot = os.path.join(self.screenshots_path, '%s.jpg' % screenshot_name)
        assert screenshots[0]['filename'] == screenshot
        assert os.path.isfile(screenshot)
        shutil.rmtree(self.screenshots_path)

    def test_screenshot_without_custom_path(self):
        screenshot_name = str(uuid.uuid4())
        self.path = self.make_test(screenshot_name)
        m = mozmill.MozMill.create()
        m.run([dict(path=self.path)])
        results = m.finish()
        screenshots = results.screenshots
        self.screenshots_path = screenshots[0]['filename'].rpartition(os.path.sep)[0]

        assert len(screenshots) == 1
        assert tempfile.gettempdir() in screenshots[0]['filename']
        assert screenshots[0]['filename'].endswith('%s.jpg' % screenshot_name)
        assert os.path.isfile(screenshots[0]['filename'])
        shutil.rmtree(self.screenshots_path)

    def tearDown(self):
        os.remove(self.path)
        if (self.screenshots_path and os.path.isdir(self.screenshots_path)):
            shutil.rmtree(self.screenshots_path)

if __name__ == '__main__':
    unittest.main()
