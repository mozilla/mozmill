#!/usr/bin/env python

import os
import prefs
import shutil
import subprocess
import tempfile
import unittest

class ProfileTest(unittest.TestCase):
    """test mozprofile"""

    def run_command(self, *args):
        """
        runs mozprofile;
        returns (stdout, stderr, code)
        """
        process = subprocess.Popen(args,
                                   stdout=subprocess.PIPE,
                                   stderr=subprocess.PIPE)
        stdout, stderr = process.communicate()
        stdout = stdout.strip()
        stderr = stderr.strip()
        return stdout, stderr, process.returncode

    def compare_generated(self, _prefs, commandline):
        """
        writes out to a new profile with mozprofile command line
        reads the generated preferences with prefs.py
        compares the results
        cleans up
        """
        profile, stderr, code = self.run_command(*commandline)
        prefs_file = os.path.join(profile, 'user.js')
        self.assertTrue(os.path.exists(prefs_file))
        read = prefs.read(prefs_file)
        self.assertEqual(_prefs, read)
        shutil.rmtree(profile)

    def test_basic_prefs(self):
        _prefs = {"browser.startup.homepage": "http://planet.mozilla.org/"}
        commandline = ["mozprofile"]
        for pref, value in _prefs.items():
            commandline += ["--pref", "%s:%s" % (pref, value)]
        self.compare_generated(_prefs, commandline)

    def test_ini(self):

        # write the .ini file
        _ini = """[DEFAULT]
browser.startup.homepage = http://planet.mozilla.org/

[foo]
browser.startup.homepage = http://github.com/
"""
        fd, name = tempfile.mkstemp(suffix='.ini')
        os.write(fd, _ini)
        os.close(fd)
        commandline = ["mozprofile", "--preferences", name]

        # test the [DEFAULT] section
        _prefs = {'browser.startup.homepage': 'http://planet.mozilla.org/'}
        self.compare_generated(_prefs, commandline)

        # test a specific section
        _prefs = {'browser.startup.homepage': 'http://github.com/'}
        commandline[-1] = commandline[-1] + ':foo'
        self.compare_generated(_prefs, commandline)

        # cleanup
        os.remove(name)

    def test_json(self):
        _prefs = {"browser.startup.homepage": "http://planet.mozilla.org/"}
        json = '{"browser.startup.homepage": "http://planet.mozilla.org/"}'

        # just repr it...could use the json module but we don't need it here
        fd, name = tempfile.mkstemp(suffix='.json')
        os.write(fd, json)
        os.close(fd)

        print name

        commandline = ["mozprofile", "--preferences", name]
        self.compare_generated(_prefs, commandline)


if __name__ == '__main__':
    unittest.main()
