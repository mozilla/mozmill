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

__all__ = ['Runner', 'ThunderbirdRunner', 'FirefoxRunner', 'runners', 'CLI', 'cli', 'get_metadata_from_egg', 'package_metadata']

import optparse
import os
import sys
import ConfigParser

from utils import findInPath
from mozprofile import *
from mozprocess.processhandler import ProcessHandler

### python package method metadata by introspection
try:
    import pkg_resources
    def get_metadata_from_egg(module):
        ret = {}
        dist = pkg_resources.get_distribution(module)
        if dist.has_metadata("PKG-INFO"):
            for line in dist.get_metadata_lines("PKG-INFO"):
                key, value = line.split(':', 1)
                key = key.strip()
                value = value.strip()
                ret[key] = value
        if dist.has_metadata("requires.txt"):
            ret["Dependencies"] = "\n" + dist.get_metadata("requires.txt")    
        return ret
except ImportError:
    # package resources not avaialable
    def get_metadata_from_egg(module):
        return {}
package_metadata = get_metadata_from_egg('mozrunner')

class Runner(object):
    """Handles all running operations. Finds bins, runs and kills the process."""

    @classmethod
    def create(cls, binary=None, cmdargs=None, env=None, kp_kwargs=None, profile_args=None, clean_profile=True):
        profile = cls.profile_class(**(profile_args or {}))
        return cls(profile, binary=binary, cmdargs=cmdargs, env=env, kp_kwargs=kp_kwargs, clean_profile=clean_profile)

    def __init__(self, profile, binary=None, cmdargs=None, env=None, kp_kwargs=None, clean_profile=True):
        self.process_handler = None
        self.profile = profile
        self.clean_profile = clean_profile

        # find the binary
        self.binary = self.__class__.get_binary(binary)
        if not os.path.exists(self.binary):
            raise OSError("Binary path does not exist: %s" % self.binary)

        self.cmdargs = cmdargs or []
        _cmdargs = [i for i in self.cmdargs
                    if i != '-foreground']
        if len(_cmdargs) != len(self.cmdargs):
            # foreground should be last; see
            # - https://bugzilla.mozilla.org/show_bug.cgi?id=625614
            # - https://bugzilla.mozilla.org/show_bug.cgi?id=626826
            self.cmdargs = _cmdargs
            self.cmdargs.append('-foreground')

        # process environment
        if env is None:
            self.env = os.environ.copy()
        else:
            self.env = env.copy()
        # allows you to run an instance of Firefox separately from any other instances
        self.env['MOZ_NO_REMOTE'] = '1'
        # keeps Firefox attached to the terminal window after it starts
        self.env['NO_EM_RESTART'] = '1'

        # set the library path if needed on linux
        if sys.platform == 'linux2' and self.binary.endswith('-bin'):
            dirname = os.path.dirname(self.binary)
            if os.environ.get('LD_LIBRARY_PATH', None):
                self.env['LD_LIBRARY_PATH'] = '%s:%s' % (os.environ['LD_LIBRARY_PATH'], dirname)
            else:
                self.env['LD_LIBRARY_PATH'] = dirname

        # arguments for killableprocess
        self.kp_kwargs = kp_kwargs or {}

    @classmethod
    def get_binary(cls, binary=None):
        """determine the binary"""
        if binary is None:
            return cls.find_binary()
        elif sys.platform == 'darwin' and binary.find('Contents/MacOS/') == -1:
            return os.path.join(binary, 'Contents/MacOS/%s-bin' % cls.names[0])
        else:
            return binary
        
    @classmethod
    def find_binary(cls):
        """Finds the binary for class names if one was not provided."""

        binary = None
        if sys.platform in ('linux2', 'sunos5', 'solaris'):
            for name in reversed(cls.names):
                binary = findInPath(name)
        elif os.name == 'nt' or sys.platform == 'cygwin':

            # find the default executable from the windows registry
            try:
                # assumes cls.app_name is defined, as it should be for
                # implementors
                import _winreg
                app_key = _winreg.OpenKey(_winreg.HKEY_LOCAL_MACHINE, r"Software\Mozilla\Mozilla %s" % cls.app_name)
                version, _type = _winreg.QueryValueEx(app_key, "CurrentVersion")
                version_key = _winreg.OpenKey(app_key, version + r"\Main")
                path, _ = _winreg.QueryValueEx(version_key, "PathToExe")
                return path
            except: # XXX not sure what type of exception this should be
                pass

            # search for the binary in the path
            for name in reversed(cls.names):
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
            for name in reversed(cls.names):
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

        config = ConfigParser.RawConfigParser()
        dirname = os.path.dirname(self.binary)
        repository = { }

        for file, section in [('application', 'App'), ('platform', 'Build')]:
            config.read(os.path.join(dirname, '%s.ini' % file))

            for key, id in [('SourceRepository', 'repository'),
                           ('SourceStamp', 'changeset')]:
                try:
                    repository['%s_%s' % (file, id)] = config.get(section, key);
                except:
                    repository['%s_%s' % (file, id)] = None

        return repository

    def is_running():
        return self.process_handler is not None

    def start(self):
        """Run self.command in the proper environment."""

        # ensure you are stopped
        self.stop()

        # run once to register any extensions
        # see:
        # - http://hg.mozilla.org/releases/mozilla-1.9.2/file/915a35e15cde/build/automation.py.in#l702
        # - http://mozilla-xp.com/mozilla.dev.apps.firefox/Rules-for-when-firefox-bin-restarts-it-s-process
        # This run just calls through processhandler to popen directly as we 
        # are not particuarly cared in tracking this process
        firstrun = ProcessHandler.Process(self.command+['-silent', '-foreground'], env=self.env, **self.kp_kwargs)
        firstrun.wait()

        # now run for real, this run uses the managed processhandler
        self.process_handler = ProcessHandler(self.command+self.cmdargs, env=self.env, **self.kp_kwargs)
        self.process_handler.run()
 
    def wait(self, timeout=None):
        """Wait for the app to exit."""
        if self.process_handler is None:
            return
        self.process_handler.waitForFinish(timeout=timeout)
        self.process_handler = None

    def stop(self):
        """Kill the app"""
        if self.process_handler is None:
            return
        self.process_handler.kill()
        self.process_handler = None

    def reset(self):
        """
        reset the runner between runs
        currently, only resets the profile, but probably should do more
        """
        self.profile.reset()

    def cleanup(self):
        self.stop()
        if self.clean_profile:
            self.profile.cleanup()

    __del__ = cleanup


class FirefoxRunner(Runner):
    """Specialized Runner subclass for running Firefox."""

    app_name = 'Firefox'
    profile_class = FirefoxProfile

    # (platform-dependent) names of binary
    if sys.platform == 'darwin':
        names = ['firefox', 'minefield', 'shiretoko']
    elif sys.platform in ('linux2', 'sunos5', 'solaris'):
        names = ['firefox', 'mozilla-firefox', 'iceweasel']
    elif os.name == 'nt' or sys.platform == 'cygwin':
        names =['firefox']
    else:
        raise AssertionError("I don't know what platform you're on")
    
    def __init__(self, profile, **kwargs):
        Runner.__init__(self, profile, **kwargs)

        # Find application version number
        appdir = os.path.dirname(os.path.realpath(self.binary))
        appini = ConfigParser.RawConfigParser()
        appini.read(os.path.join(appdir, 'application.ini'))
        # Version needs to be of the form 3.6 or 4.0b and not the whole string
        version = appini.get('App', 'Version').rstrip('0123456789pre').rstrip('.')
        
        # Disable compatibility check
        preference = {'extensions.disableCompatibility.' + version: False}
        self.profile.set_preferences(preference)
        

class ThunderbirdRunner(Runner):
    """Specialized Runner subclass for running Thunderbird"""
    app_name = 'Thunderbird'
    profile_class = ThunderbirdProfile

    names = ["thunderbird", "shredder"]

runners = {'firefox': FirefoxRunner,
           'thunderbird': ThunderbirdRunner}

class CLI(MozProfileCLI):
    """Command line interface."""

    module = "mozrunner"

    def __init__(self, args=sys.argv[1:]):
        """
        Setup command line parser and parse arguments
        - args : command line arguments
        """

        self.metadata = getattr(sys.modules[self.module],
                                'package_metadata',
                                {})
        version = self.metadata.get('Version')
        parser_args = {'description': self.metadata.get('Summary')}
        if version:
            parser_args['version'] = "%prog " + version
        self.parser = optparse.OptionParser(**parser_args)
        self.add_options(self.parser)
        (self.options, self.args) = self.parser.parse_args(args)

        if getattr(self.options, 'info', None):
            self.print_metadata()
            sys.exit(0)

        # choose appropriate runner and profile classes
        try:
            self.runner_class = runners[self.options.app]
        except KeyError:
            self.parser.error('Application "%s" unknown (should be one of "firefox" or "thunderbird")' % self.options.app)

    def add_options(self, parser):
        """add options to the parser"""

        # add profile options
        MozProfileCLI.add_options(self, parser)
        
        # add runner options
        parser.add_option('-b', "--binary",
                          dest="binary", help="Binary path.",
                          metavar=None, default=None)
        parser.add_option('--app', dest='app', default='firefox',
                          help="Application to use [DEFAULT: %default]")
        parser.add_option('--app-arg', dest='appArgs',
                          default=[], action='append',
                          help="provides an argument to the test application")
        if self.metadata:
            parser.add_option("--info", dest="info", default=False,
                              action="store_true",
                              help="Print module information")


    ### methods for introspecting data

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

    ### methods for running
                
    def command_args(self):
        """additional arguments for the mozilla application"""
        return self.options.appArgs

    def runner_args(self):
        """arguments to instantiate the runner class"""
        return dict(cmdargs=self.command_args(),
                    binary=self.options.binary,
                    profile_args=self.profile_args())
     
    def create_runner(self):
        return self.runner_class.create(**self.runner_args())

    def run(self):
        runner = self.create_runner()
        self.start(runner)
        runner.cleanup()

    def start(self, runner):
        """Starts the runner and waits for Firefox to exitor Keyboard Interrupt.
        Shoule be overwritten to provide custom running of the runner instance."""
        runner.start()
        print 'Starting:', ' '.join(runner.command)
        try:
            runner.wait()
        except KeyboardInterrupt:
            runner.stop()


def cli(args=sys.argv[1:]):
    CLI(args).run()

if __name__ == '__main__':
    cli()
