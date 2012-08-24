#!/usr/bin/env python

import os
import shutil
import tempfile
import unittest
from mozprocess import ProcessHandler
from mozprofile import FirefoxProfile


class TestProfilePath(unittest.TestCase):
    """
    test case for Mac and https://bugzilla.mozilla.org/show_bug.cgi?id=672605 :
    mozmill "--profile" option not working with relative path
    """

    def test_relative_path(self):
        tempdir = tempfile.mkdtemp()

        # make a dummy profile
        profile = FirefoxProfile(os.path.join(tempdir, 'testprofilepath'),
                                 restore=False)
        self.assertTrue(os.path.exists(os.path.join(tempdir,
                                                    'testprofilepath',
                                                    'user.js')))

        # make a dummy test
        test = """var test = function () { };"""
        f = file(os.path.join(tempdir, 'test_dummy.js'), 'w')
        f.write(test)
        f.close()

        # run mozmill on it
        process = ProcessHandler(['mozmill',
                                  '-t', 'test_dummy.js',
                                  '--profile=testprofilepath'],
                                 cwd=tempdir)
        process.run()
        process.waitForFinish()

        self.assertNotEqual(process.proc.poll(), None)

        # cleanup
        shutil.rmtree(tempdir)


if __name__ == '__main__':
    unittest.main()
