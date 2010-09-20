#!/usr/bin/env python

# ***** BEGIN LICENSE BLOCK *****
# Version: MPL 1.1/GPL 2.0/LGPL 2.1
#
# The contents of this file are subject to the Mozilla Public License Version
# 1.1 (the "License"); you may not use this file except in compliance with
# the License. You may obtain a copy of the License at
# http://www.mozilla.org/MPL/
#
# Software distributed under the License is distributed on an "AS IS" basis,
# WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
# for the specific language governing rights and limitations under the
# License.
#
# The Original Code is Mozilla Corporation Code.
#
# The Initial Developer of the Original Code is
# Mikeal Rogers.
# Portions created by the Initial Developer are Copyright (C) 2008-2009
# the Initial Developer. All Rights Reserved.
#
# Contributor(s):
#  Mikeal Rogers <mikeal.rogers@gmail.com>
#  Clint Talbert <ctalbert@mozilla.com>
#  Henrik Skupin <hskupin@mozilla.com>
#
# Alternatively, the contents of this file may be used under the terms of
# either the GNU General Public License Version 2 or later (the "GPL"), or
# the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
# in which case the provisions of the GPL or the LGPL are applicable instead
# of those above. If you wish to allow use of your version of this file only
# under the terms of either the GPL or the LGPL, and not to allow others to
# use your version of this file under the terms of the MPL, indicate your
# decision by deleting the provisions above and replace them with the notice
# and other provisions required by the GPL or the LGPL. If you do not delete
# the provisions above, a recipient may use your version of this file under
# the terms of any one of the MPL, the GPL or the LGPL.
#
# ***** END LICENSE BLOCK *****

__all__ = ['Runner', 'ThunderbirdRunner', 'FirefoxRunner', 'CLI', 'cli']

import os
import sys
import signal
import optparse

from utils import findInPath
from mozprocess import killableprocess
from mozprocess.kill import kill_process_by_name
from mozprocess.pid import get_pids
from mozprofile import *

class Runner(object):
    """Handles all running operations. Finds bins, runs and kills the process."""

    def __init__(self, binary=None, profile=None, cmdargs=[], env=None,
                 aggressively_kill=['crashreporter'], kp_kwargs={}):
        if binary is None:
            self.binary = self.find_binary()
        elif sys.platform == 'darwin':
            self.binary = os.path.join(binary, 'Contents/MacOS/%s-bin' % self.names[0])
        else:
            self.binary = binary


        if not os.path.exists(self.binary):
            raise Exception("Binary path does not exist "+self.binary)

        self.profile = profile

        self.cmdargs = cmdargs
        if env is None:
            self.env = os.environ.copy()
            self.env.update({'MOZ_NO_REMOTE':"1",})
        else:
            self.env = env
        self.aggressively_kill = aggressively_kill
        self.kp_kwargs = kp_kwargs

    def find_binary(self):
        """Finds the binary for self.names if one was not provided."""
        binary = None
        if sys.platform in ('linux2', 'sunos5', 'solaris'):
            for name in reversed(self.names):
                binary = findInPath(name)
        elif os.name == 'nt' or sys.platform == 'cygwin':

            # find the default executable from the windows registry
            try:
                # assumes self.app_name is defined, as it should be for
                # implementors
                import _winreg
                app_key = _winreg.OpenKey(_winreg.HKEY_LOCAL_MACHINE, r"Software\Mozilla\Mozilla %s" % self.app_name)
                version, _type = _winreg.QueryValueEx(app_key, "CurrentVersion")
                version_key = _winreg.OpenKey(app_key, version + r"\Main")
                path, _ = _winreg.QueryValueEx(version_key, "PathToExe")
                return path
            except: # XXX not sure what type of exception this should be
                pass

            # search for the binary in the path            
            for name in reversed(self.names):
                binary = findInPath(name)
                if sys.platform == 'cygwin':
                    program_files = os.environ['PROGRAMFILES']
                else:
                    program_files = os.environ['ProgramFiles']

                if binary is None:
                    for bin in [(program_files, 'Mozilla Firefox', 'firefox.exe'),
                                (os.environ.get("ProgramFiles(x86)"),'Mozilla Firefox', 'firefox.exe'),
                                (program_files,'Minefield', 'firefox.exe'),
                                (os.environ.get("ProgramFiles(x86)"),'Minefield', 'firefox.exe')
                                ]:
                        path = os.path.join(*bin)
                        if os.path.isfile(path):
                            binary = path
                            break
        elif sys.platform == 'darwin':
            for name in reversed(self.names):
                appdir = os.path.join('Applications', name.capitalize()+'.app')
                if os.path.isdir(os.path.join(os.path.expanduser('~/'), appdir)):
                    binary = os.path.join(os.path.expanduser('~/'), appdir,
                                          'Contents/MacOS/'+name+'-bin')
                elif os.path.isdir('/'+appdir):
                    binary = os.path.join("/"+appdir, 'Contents/MacOS/'+name+'-bin')

                if binary is not None:
                    if not os.path.isfile(binary):
                        binary = binary.replace(name+'-bin', 'firefox-bin')
                    if not os.path.isfile(binary):
                        binary = None
        if binary is None:
            raise Exception('Mozrunner could not locate your binary, you will need to set it.')
        return binary

    @property
    def command(self):
        """Returns the command list to run."""
        return [self.binary, '-profile', self.profile.profile]

    def get_repositoryInfo(self):
        """Read repository information from application.ini and platform.ini."""
        import ConfigParser

        config = ConfigParser.RawConfigParser()
        dirname = os.path.dirname(self.binary)
        repository = { }

        for entry in [['application', 'App'], ['platform', 'Build']]:
            (file, section) = entry
            config.read(os.path.join(dirname, '%s.ini' % file))

            for entry in [['SourceRepository', 'repository'], ['SourceStamp', 'changeset']]:
                (key, id) = entry

                try:
                    repository['%s_%s' % (file, id)] = config.get(section, key);
                except:
                    repository['%s_%s' % (file, id)] = None

        return repository

    def start(self):
        """Run self.command in the proper environment."""
        if self.profile is None:
            self.profile = self.profile_class()
        self.process_handler = killableprocess.runCommand(self.command+self.cmdargs, env=self.env, **self.kp_kwargs)

    def wait(self, timeout=None):
        """Wait for the browser to exit."""
        self.process_handler.wait(timeout=timeout)

        if sys.platform != 'win32':
            for name in self.names:
                for pid in get_pids(name, self.process_handler.pid):
                    self.process_handler.pid = pid
                    self.process_handler.wait(timeout=timeout)

    def stop(self, kill_signal=signal.SIGTERM):
        """Kill the browser"""
        if sys.platform != 'win32':
            self.process_handler.kill()
            for name in self.names:
                for pid in get_pids(name, self.process_handler.pid):
                    self.process_handler.pid = pid
                    self.process_handler.kill()
        else:
            try:
                self.process_handler.kill(group=True)
            except Exception, e:
                raise Exception('Cannot kill process, '+type(e).__name__+' '+e.message)

        for name in self.aggressively_kill:
            kill_process_by_name(name)


class FirefoxRunner(Runner):
    """Specialized Runner subclass for running Firefox."""

    app_name = 'Firefox'
    profile_class = FirefoxProfile

    @property
    def names(self):
        if sys.platform == 'darwin':
            return ['firefox', 'minefield', 'shiretoko']
        if (sys.platform == 'linux2') or (sys.platform in ('sunos5', 'solaris')):
            return ['firefox', 'mozilla-firefox', 'iceweasel']
        if os.name == 'nt' or sys.platform == 'cygwin':
            return ['firefox']

class ThunderbirdRunner(Runner):
    """Specialized Runner subclass for running Thunderbird"""

    app_name = 'Thunderbird'
    profile_class = ThunderbirdProfile

    names = ["thunderbird", "shredder"]

class CLI(object):
    """Command line interface."""

    runner_class = FirefoxRunner
    profile_class = FirefoxProfile
    module = "mozrunner"


    def __init__(self, args=sys.argv[1:]):
        """
        Setup command line parser and parse arguments
        - args : command line arguments
        """
        self.metadata = self.get_metadata_from_egg()
        self.parser = optparse.OptionParser(version="%prog " + self.metadata["Version"])
        self.add_options(self.parser)
        (self.options, self.args) = self.parser.parse_args(args)

        # XXX temporary hack
        self.addons = self.options.addons

        if self.options.info:
            self.print_metadata()
            sys.exit(0)
            
    def add_options(self, parser):
        """add options to the parser"""
        
        parser.add_option('-b', "--binary",
                          dest="binary", help="Binary path.",
                          metavar=None, default=None)
        
        parser.add_option('-p', "--profile",
                         dest="profile", help="Profile path.",
                         metavar=None, default=None)
        
        parser.add_option('-a', "--addon", dest="addons",
                         action='append',
                         help="Addons paths to install",
                         metavar=None, default=[])
        
        parser.add_option("--info", dest="info", default=False,
                          action="store_true",
                          help="Print module information")
        
            
    def get_metadata_from_egg(self):
        import pkg_resources
        ret = {}
        dist = pkg_resources.get_distribution(self.module)
        if dist.has_metadata("PKG-INFO"):
            for line in dist.get_metadata_lines("PKG-INFO"):
                key, value = line.split(':', 1)
                ret[key] = value
        if dist.has_metadata("requires.txt"):
            ret["Dependencies"] = "\n" + dist.get_metadata("requires.txt")    
        return ret
        
    def print_metadata(self, data=("Name", "Version", "Summary", "Home-page", 
                                   "Author", "Author-email", "License", "Platform", "Dependencies")):
        for key in data:
            if key in self.metadata:
                print key + ": " + self.metadata[key]

    def create_runner(self):
        """ Get the runner object """
        runner = self.get_runner(binary=self.options.binary)
        profile = self.get_profile(binary=runner.binary,
                                   profile=self.options.profile,
                                   addons=self.addons)
        runner.profile = profile
        return runner

    def get_runner(self, binary=None, profile=None):
        """Returns the runner instance for the given command line binary argument
        the profile instance returned from self.get_profile()."""
        return self.runner_class(binary, profile)

    def get_profile(self, binary=None, profile=None, addons=None, preferences=None):
        """Returns the profile instance for the given command line arguments."""
        addons = addons or []
        preferences = preferences or {}
        return self.profile_class(binary, profile, addons, preferences)

    def run(self):
        runner = self.create_runner()
        self.start(runner)
        runner.profile.cleanup()

    def start(self, runner):
        """Starts the runner and waits for Firefox to exitor Keyboard Interrupt.
        Shoule be overwritten to provide custom running of the runner instance."""
        runner.start()
        print 'Started:', ' '.join(runner.command)
        try:
            runner.wait()
        except KeyboardInterrupt:
            runner.stop()


def cli(args=sys.argv[1:]):
    CLI(args).run()

if __name__ == '__main__':
    cli()
