import subprocess
import os
import signal
import sys
import select
import types
from datetime import datetime, timedelta

import pdb

if sys.platform == 'win32':
    import ctypes, ctypes.wintypes, time, msvcrt
    import winprocess
    from qijo import JobObjectAssociateCompletionPortInformation

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

        def kill(self, group=True):
            if sys.platform == 'win32':
                if group and self._job:
                    winprocess.TerminateJobObject(self._job, 127)
                else:
                    try:
                        winprocess.TerminateProcess(self._handle, 127)
                    except:
                        # TODO: better error handling here
                        pass
                self.returncode = 127
            else:
                os.kill(self.pid, signal.SIGKILL)
        
        """ Private Members of Process class """
        if sys.platform == 'win32':
            # Redefine the execute child so that we can track process groups
            def _execute_child(self, args, executable, preexec_fn, close_fds,
                               cwd, env, universal_newlines, startupinfo,
                               creationflags, shell,
                               p2cread, p2cwrite,
                               c2pread, c2pwrite,
                               errread, errwrite):
                if not isinstance(args, types.StringTypes):
                    args = subprocess.list2cmdline(args)
                
                # Always or in the create new process group
                creationflags |= winprocess.CREATE_NEW_PROCESS_GROUP

                if startupinfo is None:
                    startupinfo = winprocess.STARTUPINFO()

                if None not in (p2cread, c2pwrite, errwrite):
                    startupinfo.dwFlags |= winprocess.STARTF_USESTDHANDLES
                    startupinfo.hStdInput = int(p2cread)
                    startupinfo.hStdOutput = int(c2pwrite)
                    startupinfo.hStdError = int(errwrite)
                if shell:
                    startupinfo.dwFlags |= winprocess.STARTF_USESHOWWINDOW
                    startupinfo.wShowWindow = winprocess.SW_HIDE
                    comspec = os.environ.get("COMSPEC", "cmd.exe")
                    args = comspec + " /c " + args

                # determine if we can create create a job
                canCreateJob = winprocess.CanCreateJobObject()

                # set process creation flags
                creationflags |= winprocess.CREATE_SUSPENDED
                creationflags |= winprocess.CREATE_UNICODE_ENVIRONMENT
                if canCreateJob:
                    creationflags |= winprocess.CREATE_BREAKAWAY_FROM_JOB

                # create the process
                hp, ht, pid, tid = winprocess.CreateProcess(
                    executable, args,
                    None, None, # No special security
                    1, # Must inherit handles!
                    creationflags,
                    winprocess.EnvironmentBlock(env),
                    cwd, startupinfo)
                self._child_created = True
                self._handle = hp
                self._thread = ht
                self.pid = pid
                self.tid = tid

                if canCreateJob:
                    # We create a new job for this process, so that we can kill
                    # the process and any sub-processes                    
                    # Create the IO Completion Port
                    self._io_port = winprocess.CreateIoCompletionPort()
                    self._job = winprocess.CreateJobObject()

                    pdb.set_trace()
                    
                    # Now associate the io comp port and the job object
                    joacp = winprocess.JOBOBJECT_ASSOCIATE_COMPLETION_PORT(winprocess.COMPKEY_JOBOBJECT,
                                                                           self._io_port)
                    joacpsz = joacp.__sizeof__()
                    winprocess.SetInformationJobObject(self._job,
                                                       JobObjectAssociateCompletionPortInformation,
                                                       joacp
                                                       )
                                                       
                    # Assign the job object to the process
                    winprocess.AssignProcessToJobObject(self._job, int(hp))
                else:
                    self._job = None
                        
                winprocess.ResumeThread(int(ht))
                ht.Close()

                if p2cread is not None:
                    p2cread.Close()
                if c2pwrite is not None:
                    c2pwrite.Close()
                if errwrite is not None:
                    errwrite.Close()
                time.sleep(.1)

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

    def kill(self, children=True):
        """
          Kills the managed process and unless children==False, then it will
          also kill all child processes spawned by it.
          Note that this does not manage any state, save any output etc,
          it immediately kills the process.
        """
        return self.proc.kill(children)

    def readWithTimeout(self, f, timeout):
        """
          Try to read a line of output from the file object |f|.
          |f| must be a  pipe, like the |stdout| member of a subprocess.Popen
          object created with stdout=PIPE. If no output
          is received within |timeout| seconds, return a blank line.
          Returns a tuple (line, did_timeout), where |did_timeout| is True
          if the read timed out, and False otherwise.
          
          Calls a private member because this is a different function based on
          the OS
        """
        return self._readWithTimeout(f, timeout)

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

    """
      Private Functions From here on down. Thar be dragons.
    """
    if sys.platform == 'win32':
        # Windows Specific private functions are defined in this block
        PeekNamedPipe = ctypes.windll.kernel32.PeekNamedPipe
        GetLastError = ctypes.windll.kernel32.GetLastError

        def _readWithTimeout(self, f, timeout):
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
        # Generic 
        def _readWithTimeout(self, f, timeout):
            try:
                (r, w, e) = select.select([f], [], [], timeout)
            except:
                # TODO: return a blank line?
                return ('', True)

            if len(r) == 0:
                return ('', True)
            return (f.readline(), False)
