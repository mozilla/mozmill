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
# Portions created by the Initial Developer are Copyright (C) 2010
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

import copy
import datetime
import optparse
import tempfile

import mozmill_wrapper
import testrun

class BftTestRun(testrun.RestartTestRun):
    """ Class to execute a Firefox BFT test-run """

    def __init__(self, *args, **kwargs):
        super(BftTestRun, self).__init__(*args, **kwargs)

    def run_test(self, *args, **kwargs):
        try:
            self.test_path = os.path.join('firefox', 'testDownloading')
            super(testrun.RestartTestRun, self).run_test(*args, **kwargs)
        except Exception, e:
            pass

        try:
            self.test_path = os.path.join('firefox','restartTests','testExtensionInstallUninstall')
            super(BftTestRun, self).run_test(*args, **kwargs)
        except Exception, e:
            pass

def main():
    usage = "usage: %prog [options] (build|folder)"
    parser = optparse.OptionParser(usage = usage, version = "%prog 0.1")
    parser.add_option("--report", dest="report", metavar="URL",
                      help = "Send results to the report server")
    (options, binaries) = parser.parse_args()

    run = BftTestRun()
    run.binaries = binaries
    run.report_url = options.report
    run.run()

if __name__ == "__main__":
    main()
