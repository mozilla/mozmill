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
# The Original Code is mozprofile command line interface.
#
# The Initial Developer of the Original Code is
# Mozilla Corporation.
# Portions created by the Initial Developer are Copyright (C) 2011
# the Initial Developer. All Rights Reserved.
#
# Contributor(s):
#  Andrew Halberstadt <halbersa@gmail.com>
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
"""
Creates and/or modifies a Firefox profile.
The profile can be modified by passing in addons to install or preferences to set.
If no profile is specified, a new profile is created and the path of the resulting profile is printed.
"""

import sys
from optparse import OptionParser
from profile import Profile
from addons import AddonManager

def cli(argv=sys.argv[1:]):
    usage = "%prog [options]"
    parser = OptionParser(usage=usage, description=__doc__)

    parser.add_option("-p", "--profile", dest="profile",
                        help="The profile to operate on. " +
                             "If none, creates a new profile in temp directory")
    parser.add_option("-a", "--addon", dest="addons",
                        action="append",
                        help="An addon to install. " + 
                             "Can be a filepath, a directory containing addons, or a url")
    parser.add_option("-m", "--addon-manifests", dest="manifests",
                        action="append",
                        help="An addon manifest to install")
    parser.add_option("--pref", dest="prefs",
                        action='append',
                        default=[],
                        help="A string preference to set. " +
                             "Must be a key-value pair separated by a ':'")
    parser.add_option("--print-addon-ids", dest="print_addons",
                        help="A list of addon filepaths. " +
                             "Prints the id of each addon and exits")
    opt, args = parser.parse_args(argv)
    
    if opt.print_addons:
        for arg in opt.print_addons:
            print AddonManager.get_addon_id(arg)
        return True
   
    # The profile class calls dict.update() which can accept an iterable of iterables of length two
    for i in range(len(opt.prefs)):
        if ':' not in opt.prefs[i]:
            parser.error("preference must be a key-value pair separated by a ':'")
        opt.prefs[i] = opt.prefs[i].split(':', 1)

    if opt.addons or opt.manifests:
        # Some sort of user feedback is needed when installing addons
        # since it can potentially take a long time to finish
        print "Installing addons..."

    profile = Profile(profile=opt.profile, addons=opt.addons,
                      addon_manifests=opt.manifests, preferences=opt.prefs, restore=False)
    
    # if no profile was passed in print the newly created profile
    if not opt.profile:
        print profile.profile 
    return True
