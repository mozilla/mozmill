import unittest
import os
import sys
from time import sleep

from mozprocess import killableprocess

class ProcTest1(unittest.TestCase):

    def startchrome(self):
        CHROMEPATH = ["C:\\Users\\ctalbert\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe"]
        args = ["http://www.mozilla.org", "http://www.wikipedia.org"]
        cmd = CHROMEPATH + args
        p = killableprocess.run_command(cmd, env = os.environ, None)
        return p

    def test_multiprockill(self):
        p = self.startchrome()
        sleep(15)
        p.kill()

    def test_multiwaittimeout(self):
        p = self.startchrome()
        p.wait(timeout=30)
        


