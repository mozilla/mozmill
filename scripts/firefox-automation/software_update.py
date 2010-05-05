#!/usr/bin/python

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
# The Original Code is MozMill Test code.
#
# The Initial Developer of the Original Code is Mozilla Foundation.
# Portions created by the Initial Developer are Copyright (C) 2009
# the Initial Developer. All Rights Reserved.
#
# Contributor(s):
#   Henrik Skupin <hskupin@mozilla.com>
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

mozmill_test_repository = 'http://hg.mozilla.org/qa/mozmill-tests'

import copy
import datetime
import mozmill
import optparse
import os
import sys
import tempfile

try:
    import json
except:
    import simplejson as json

abs_path = os.path.dirname(os.path.abspath(__file__))

# Import local libraries
sys.path.append(os.path.join(abs_path, "libs"))
from install import Installer
from application import UpdateChannel
from application import ApplicationIni
from repository import Repository

class SoftwareUpdateCLI(mozmill.RestartCLI):
    app_binary = {'darwin' : '', 'linux2' : '/firefox', 'win32' : '/firefox.exe'}

    # Parser options and arguments
    parser_options = copy.copy(mozmill.RestartCLI.parser_options)
    parser_options.pop(("-s", "--shell"))
    parser_options.pop(("-t", "--test",))
    parser_options.pop(("-u", "--usecode"))

    parser_options[("-c", "--channel",)] = dict(dest="channel", default=None, 
                                           help="Update channel (betatest, beta, nightly, releasetest, release)")
    parser_options[("--no-fallback",)] = dict(dest="no_fallback", default=None,
                                              action = "store_true",
                                              help="No fallback update should be performed")
    parser_options[("-t", "--type",)] = dict(dest="type", default="minor",
                                             nargs = 1,
                                             help="Type of the update (minor, major)")
    parser_options[("-i", "--install",)] = dict(dest="install", default=None,
                                                nargs = 1,
                                                help="Installation folder for the build")

    def __init__(self):
        super(SoftwareUpdateCLI, self).__init__()
        self.options.shell = None
        self.options.usecode = None
        self.options.plugins = None

        # If the script gets a list of arguments check for folders and expand
        # those recursively. Get rid of hidden files like .DS_Store on Mac
        if self.options.install:
            builds = [ ]
            for entry in self.args:
                if not os.path.exists(entry):
                    print "Failure: '%s' cannot be found." % (entry)
                    sys.exit(1)
                if not os.path.isdir(entry):
                    builds.append(os.path.abspath(entry))
                    continue
                for root, dirs, files in os.walk(entry):
                    for file in files:
                        if not file in [".DS_Store"]:
                            builds.append(os.path.abspath(os.path.join(root, file)))
            self.args = builds

        # We need at least one argument
        if len(self.args) < 1:
            print "No files or directories specified. Please run with --help to see all options."
            sys.exit(1)

        # Check the type of the update and default to minor
        if self.options.type not in ["minor", "major"]:
            self.options.type = "minor"

        # Clone the test repository
        tmp_folder = tempfile.mkdtemp(".mozmill-tests")
        self.repository = Repository(mozmill_test_repository, tmp_folder)
        self.repository.clone()

        # Set folder which contains the software update tests
        self.test_folder = tmp_folder + "/firefox/softwareUpdate/"

    def __del__(self):
        # Remove the test repository
        self.repository.remove()

    def prepare_channel(self):
        channel = UpdateChannel()
        channel.setFolder(self.options.folder)

        if self.options.channel is None:
            self.channel = channel.getChannel()
        else:
            channel.setChannel(self.options.channel)
            self.channel = self.options.channel

    def prepare_tests(self):
        # Get the source repository ...
        ini = ApplicationIni(self.options.folder)
        repo = ini.get('App', 'SourceRepository')

        branch = self.repository.identify_branch(repo)
        self.repository.update(branch)

    def prepare_build(self, binary):
        ''' Prepare the build for the test run '''
        if self.options.install is not None:
            self.options.folder = Installer().install(binary, self.options.install)
            self.options.binary = self.options.folder + self.app_binary[sys.platform]
        else:
            folder = os.path.dirname(binary)
            self.options.folder = folder if not os.path.isdir(binary) else binary
            self.options.binary = binary

    def cleanup_build(self):
        # Always remove the build when it has been installed
        if self.options.install:
            Installer().uninstall(self.options.folder)

    def build_wiki_entry(self, results):
        entry = "* %s => %s, %s, %s, %s, %s, %s, '''%s'''\n" \
                "** %s ID:%s\n** %s ID:%s\n" \
                "** Passed %d :: Failed %d :: Skipped %d\n" % \
                (results.get("preVersion", ""),
                 results.get("postVersion", ""),
                 results.get("type"),
                 results.get("preLocale", ""),
                 results.get("updateType", "unknown type"),
                 results.get("channel", ""),
                 datetime.date.today(),
                 "PASS" if results.get("success", False) else "FAIL",
                 results.get("preUserAgent", ""), results.get("preBuildId", ""),
                 results.get("postUserAgent", ""), results.get("postBuildId", ""),
                 len(results.get("passes")),
                 len(results.get("fails")),
                 len(results.get("skipped")))
        return entry

    def run_test(self, binary, is_fallback = False, *args, **kwargs):
        try:
            self.prepare_build(binary)
            self.prepare_channel()
            self.prepare_tests()

            self.mozmill.passes = []
            self.mozmill.fails = []
            self.mozmill.skipped = []
            self.mozmill.alltests = []

            self.mozmill.persisted = {}
            self.mozmill.persisted["channel"] = self.channel
            self.mozmill.persisted["type"] = self.options.type

            if is_fallback:
                self.options.test = self.test_folder + "testFallbackUpdate/"
            else:
                self.options.test = self.test_folder + "testDirectUpdate/"

            super(SoftwareUpdateCLI, self)._run(*args, **kwargs)
        except Exception, e:
            print e

        self.cleanup_build()

        # If a Mozmill test fails the update will also fail
        if self.mozmill.fails:
            self.mozmill.persisted["success"] = False

        self.mozmill.persisted["passes"] = self.mozmill.passes
        self.mozmill.persisted["fails"] = self.mozmill.fails
        self.mozmill.persisted["skipped"] = self.mozmill.skipped

        return self.mozmill.persisted

    def run(self, *args, **kwargs):
        ''' Run software update tests for all specified builds '''

        # Run direct and fallback update tests for each build
        self.wiki = []
        for binary in self.args:
            direct = self.run_test(binary, False)
            result_direct = direct.get("success", False);

            if not self.options.no_fallback:
                fallback = self.run_test(binary, True)
                result_fallback = fallback.get("success", False)
            else:
                result_fallback = False

            if not (result_direct and result_fallback):
                self.wiki.append(self.build_wiki_entry(direct))
            if not self.options.no_fallback:
                self.wiki.append(self.build_wiki_entry(fallback))

        # Print results to the console
        print "\nResults:\n========"
        for result in self.wiki:
            print result

if __name__ == "__main__":
    SoftwareUpdateCLI().run()
