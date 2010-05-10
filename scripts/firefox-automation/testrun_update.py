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
# The Original Code is MozMill automation code.
#
# The Initial Developer of the Original Code is the Mozilla Foundation.
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

import os, sys
base_path = os.path.dirname(os.path.abspath(__file__))
sys.path.append(os.path.join(base_path, 'libs'))

# Global modules
import optparse
import tempfile

# Local modules
import application
import mozmill_wrapper
import testrun


# Global modules
import datetime
import mozmill
import os
import sys

class UpdateTestRun(testrun.RestartTestRun):
    """ Class to execute software update tests """

    def __init__(self, *args, **kwargs):
        super(UpdateTestRun, self).__init__(*args, **kwargs)

    #def prepare_channel(self):
    #    channel = application.UpdateChannel()
    #    channel.setFolder(self.options.folder)
    #
    #    if self.options.channel is None:
    #        self.channel = channel.getChannel()
    #    else:
    #        channel.setChannel(self.options.channel)
    #        self.channel = self.options.channel

    #def build_wiki_entry(self, results):
    #    entry = "* %s => %s, %s, %s, %s, %s, %s, '''%s'''\n" \
    #            "** %s ID:%s\n** %s ID:%s\n" \
    #            "** Passed %d :: Failed %d :: Skipped %d\n" % \
    #            (results.get("preVersion", ""),
    #             results.get("postVersion", ""),
    #             results.get("type"),
    #             results.get("preLocale", ""),
    #             results.get("updateType", "unknown type"),
    #             results.get("channel", ""),
    #             datetime.date.today(),
    #             "PASS" if results.get("success", False) else "FAIL",
    #             results.get("preUserAgent", ""), results.get("preBuildId", ""),
    #             results.get("postUserAgent", ""), results.get("postBuildId", ""),
    #             len(results.get("passes")),
    #             len(results.get("fails")),
    #             len(results.get("skipped")))
    #    return entry

    def run_test(self, *args, **kwargs):
        try:
            #self._mozmill.persisted = {}
            #self._mozmill.persisted["channel"] = 'nightly' #self.channel

            self.test_path = os.path.join('firefox','softwareUpdate','testDirectUpdate')
            super(UpdateTestRun, self).run_test(*args, **kwargs)
        except Exception, e:
            print e

        # If a Mozmill test fails the update will also fail
        #if self.mozmill.fails:
        #    self.mozmill.persisted["success"] = False
        #
        #self.mozmill.persisted["passes"] = self.mozmill.passes
        #self.mozmill.persisted["fails"] = self.mozmill.fails
        #self.mozmill.persisted["skipped"] = self.mozmill.skipped
        #
        #return self.mozmill.persisted

    #def run(self, *args, **kwargs):
    #    ''' Run software update tests for all specified builds '''
    #
    #    # Run direct and fallback update tests for each build
    #    self.wiki = []
    #    for binary in self.args:
    #        direct = self.run_test(binary, False)
    #        result_direct = direct.get("success", False);
    #
    #        if not self.options.no_fallback:
    #            fallback = self.run_test(binary, True)
    #            result_fallback = fallback.get("success", False)
    #        else:
    #            result_fallback = False
    #
    #        if not (result_direct and result_fallback):
    #            self.wiki.append(self.build_wiki_entry(direct))
    #        if not self.options.no_fallback:
    #            self.wiki.append(self.build_wiki_entry(fallback))
    #
    #    # Print results to the console
    #    print "\nResults:\n========"
    #    for result in self.wiki:
    #        print result

def main():
    usage = "usage: %prog [options] (binary|folder)"
    parser = optparse.OptionParser(usage = usage, version = "%prog 0.1")
    parser.add_option("--channel",
                      dest = "channel",
                      metavar = "CHANNEL",
                      default = None,
                      choices = [None, "nightly", "betatest", "beta",
                                 "releasetest", "release"],
                      help = "Update channel")
    parser.add_option("--no-fallback",
                      dest = "no_fallback",
                      default = False,
                      help = "No fallback update should be performed")
    parser.add_option("--report",
                      dest = "report_url",
                      metavar = "URL",
                      help = "Send results to the report server")
    (options, binaries) = parser.parse_args()

    run = UpdateTestRun()
    run.binaries = binaries
    run.report_url = options.report_url
    run.run()

if __name__ == "__main__":
    main()
