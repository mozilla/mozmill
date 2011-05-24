import unittest
import os
import sys
import subprocess
from time import sleep

from mozprocess import processhandler

class ProcTest1(unittest.TestCase):

    # Ideally, I'd use setUpClass but that only exists in 2.7.
    # So this will get called before every single test, but it will at least
    # be a no-op after the first one.
    def setUp(self):
        p = subprocess.Popen(["make"], shell=True, cwd=os.path.dirname(__file__))
        p.communicate()
        if sys.platform == "win32":
            self.proclaunch = os.path.join(os.path.dirname(__file__), "proclaunch.exe")
        else:
            self.proclaunch = "./proclaunch"
 
    def test_process_normal_finish(self):
        """ Process is started, runs to completion while we wait for it 
        """
        p = processhandler.ProcessHandler(self.proclaunch, 
                                          ["process_normal_finish.ini"],
                                          cwd=os.path.dirname(__file__))
        p.run()
        p.waitForFinish()

        self.check_for_process()

    def test_process_waittimeout(self):
        """ Process is started, runs but we time out waiting on it
            to complete
        """
        p = processhandler.ProcessHandler([self.proclaunch,
                                          "process_waittimeout.ini"],
                                          cwd=os.path.dirname(__file__))
        p.run()
        p.waitForFinish(timeout=30)

        self.check_for_process()
    
    def test_process_kill(self):
        """ Process is started, we kill it
        """
        p = processhandler.ProcessHandler(self.proclaunch,
                                          ["process_normal_finish.ini"],
                                          cwd=os.path.dirname(__file__))
        p.run()
        p.kill()

        self.check_for_process()

    def check_for_process(self, isalive=False):
        """ Set isalive to True to succeed if the process exists.
            By default this function succeeds if no process exists.
        """
        if sys.platform == "win32":
            # On windows we use tasklist
            p1 = subprocess.Popen(["tasklist"], stdout=subprocess.PIPE)
            output = p1.communicate()[0]
            detected = False
            for line in output:
                if self.proclaunch in line:
                    detected = True
                    break
            
            
        else:
            p1 = subprocess.Popen(["ps", "-A"], stdout=subprocess.PIPE)
            p2 = subprocess.Popen(["grep", "proclaunch"], stdin=p1.stdout, stdout=subprocess.PIPE)
            p1.stdout.close()
            output = p2.communicate()[0]
            detected = False
            for line in output:
                if "grep proclaunch" in line:
                    continue
                elif "proclaunch" in line:
                    detected = True
                    break

        if detected:
            print "*****Test fails: %s", output
            self.assertTrue(isalive, "Detected process is still running")
        else:
            self.assertTrue(not isalive, "Process ended")


