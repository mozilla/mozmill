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

import ConfigParser
import optparse
import os
import subprocess
import sys

BASE_PATH = os.path.dirname(os.path.abspath(__file__))
DEFAULT_SCRIPT = os.path.abspath(os.path.join(BASE_PATH, "testrun_all.py"))
DEFAULT_CONFIG = os.path.join(BASE_PATH, "configs/testrun_daily.ini.example")

def main():
    usage = "usage: %prog [options]"
    parser = optparse.OptionParser(usage=usage, version="%prog 0.1")
    parser.add_option("--config",
                      default=DEFAULT_CONFIG,
                      dest="config",
                      metavar="PATH",
                      help="Path to the config file")
    parser.add_option('--display',
                      default=":0.0",
                      dest="display",
                      help="Display to run Firefox on")
    parser.add_option("--logfile",
                      default=None,
                      dest="logfile",
                      metavar="PATH",
                      help="Path to the log file")
    (options, binaries) = parser.parse_args()

    # To run the script via crontab on Linux we have to set the display
    if sys.platform in ("linux2", "sunos5"):
        os.putenv('DISPLAY', options.display)

    # Read all data from the config file
    try:
        filename = os.path.abspath(options.config)
        config = ConfigParser.RawConfigParser()
        config.read(filename)

        # Get the url of the report server
        report_url = config.get("reports", "url")
        report_option = '--report=%s' % report_url if report_url != '' else None

        # Get the list of binaries for the current platform
        binaries = [binary for name, binary in config.items(sys.platform)]
    except Exception, e:
        print "Failure in reading the config file at '%s'" % filename
        sys.exit(1)

    # Run tests for each binary (we can't run a fallback update test)
    for binary in binaries:
        cmdArgs = ["python", DEFAULT_SCRIPT, "--no-fallback"]
        if report_option is not None:
            cmdArgs.append(report_option)
        if options.logfile is not None:
            cmdArgs.append("--logfile=%s" % options.logfile)
        cmdArgs.append(binary)
        result = subprocess.call(cmdArgs)

if __name__ == '__main__':
    main()
