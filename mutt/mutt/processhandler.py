import subprocess
import os
import signal
import sys
import select
from datetime import datetime, timedelta

if sys.platform == 'win32':
  import ctypes, ctypes.wintypes, time, msvcrt

class ProcessHandler(object):
  """Class which represents a process to be executed."""

  class Process(subprocess.Popen):
    """
    Represents our view of a subprocess.
    It adds a kill() method which allows it to be stopped explicitly.
    """

    def __init__(self,
                 args,
                 bufsize=0,
                 executable=None,
                 stdin=None,
                 stdout=None,
                 stderr=None,
                 preexec_fn=None,
                 close_fds=False,
                 shell=False,
                 cwd=None,
                 env=None,
                 universal_newlines=False,
                 startupinfo=None,
                 creationflags=0):
      subprocess.Popen.__init__(self, args, bufsize, executable,
                                stdin, stdout, stderr,
                                preexec_fn, close_fds,
                                shell, cwd, env,
                                universal_newlines, startupinfo, creationflags)

    def kill(self):
      if sys.platform == 'win32':
        import platform
        pid = "%i" % self.pid
        if platform.release() == "2000":
          # Windows 2000 needs 'kill.exe' from the 
          #'Windows 2000 Resource Kit tools'. (See bug 475455.)
          try:
            subprocess.Popen(["kill", "-f", pid]).wait()
          except:
            raise Exception("Missing 'kill' utility to kill process with pid=%s. Kill it manually!" % pid)
        else:
          # Windows XP and later.
          subprocess.Popen(["taskkill", "/F", "/PID", pid]).wait()
      else:
        os.kill(self.pid, signal.SIGKILL)

  def __init__(self, cmd, args=None, cwd=None):
    self.cmd = cmd
    self.args = args
    self.cwd = cwd
    self.didTimeout = False
    self._output = []

  @property
  def timedOut(self):
    """True if the process has timed out."""
    return self.didTimeout

  @property
  def output(self):
    """Gets the output of the process."""
    return self._output

  def run(self):
    """Starts the process.  waitForFinish must be called to allow the
       process to complete.
    """
    self.didTimeout = False
    self.ouptut = []
    self.startTime = datetime.now()
    self.proc = self.Process([self.cmd] + self.args,
                             stdout = subprocess.PIPE,
                             stderr = subprocess.STDOUT,
                             cwd=self.cwd)

  if sys.platform == 'win32':
    PeekNamedPipe = ctypes.windll.kernel32.PeekNamedPipe
    GetLastError = ctypes.windll.kernel32.GetLastError

    def readWithTimeout(self, f, timeout):
      """Try to read a line of output from the file object |f|.
      |f| must be a  pipe, like the |stdout| member of a subprocess.Popen
      object created with stdout=PIPE. If no output
      is received within |timeout| seconds, return a blank line.
      Returns a tuple (line, did_timeout), where |did_timeout| is True
      if the read timed out, and False otherwise."""
      if timeout is None:
        # shortcut to allow callers to pass in "None" for no timeout.
        return (f.readline(), False)
      x = msvcrt.get_osfhandle(f.fileno())
      l = ctypes.c_long()
      done = time.time() + timeout
      while time.time() < done:
        if self.PeekNamedPipe(x, None, 0, None, ctypes.byref(l), None) == 0:
          err = self.GetLastError()
          if err == 38 or err == 109: # ERROR_HANDLE_EOF || ERROR_BROKEN_PIPE
            return ('', False)
          else:
            log.error("readWithTimeout got error: %d", err)
        if l.value > 0:
          # we're assuming that the output is line-buffered,
          # which is not unreasonable
          return (f.readline(), False)
        time.sleep(0.01)
      return ('', True)

  else:
    def readWithTimeout(self, f, timeout):
      """Try to read a line of output from the file object |f|. If no output
      is received within |timeout| seconds, return a blank line.
      Returns a tuple (line, did_timeout), where |did_timeout| is True
      if the read timed out, and False otherwise."""
      (r, w, e) = select.select([f], [], [], timeout)
      if len(r) == 0:
        return ('', True)
      return (f.readline(), False)

  def processOutputLine(self, line):
    """Called for each line of output that a process sends to stdout/stderr.
    """
    pass

  def onTimeout(self):
    """Called when a process times out."""
    pass

  def onFinish(self):
    """Called when a process finishes without a timeout."""
    pass

  def waitForFinish(self, timeout=None, outputTimeout=None, storeOutput=True, logfile=None):
    """Handle process output until the process terminates or times out.
    
       If timeout is not None, the process will be allowed to continue for
       that number of seconds before being killed.
       
       If outputTimeout is not None, the process will be allowed to continue
       for that number of seconds without producing any output before
       being killed.
       
       If storeOutput=True, the output produced by the process will be saved
       as self.output.
       
       If logfile is not None, the output produced by the process will be 
       appended to the given file.
    """
    self.didTimeout = False
    logsource = self.proc.stdout

    lineReadTimeout = None
    if timeout:
      lineReadTimeout = timeout - (datetime.now() - self.startTime).seconds
    elif outputTimeout:
      lineReadTimeout = outputTimeout

    if logfile is not None:
      log = open(logfile, 'a')

    (line, self.didTimeout) = self.readWithTimeout(logsource, lineReadTimeout)
    while line != "" and not self.didTimeout:
      if storeOutput:
        self._output.append(line.rstrip())
      if logfile is not None:
        log.write(line)
      self.processOutputLine(line)
      if timeout:
        lineReadTimeout = timeout - (datetime.now() - self.startTime).seconds
      (line, self.didTimeout) = self.readWithTimeout(logsource, lineReadTimeout)

    if logfile is not None:
      log.close()

    if self.didTimeout:
      self.proc.kill()
      self.onTimeout()
    else:
      self.onFinish()

    status = self.proc.wait()
    return status
