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

__all__ = ['Profile', 'FirefoxProfile', 'ThunderbirdProfile']

import os
import tempfile
from addons import AddonManager

try:
    import simplejson
except ImportError:
    import json as simplejson

# Use dir_util for copy/rm operations because shutil is all kinds of broken
from distutils import dir_util
copytree = dir_util.copy_tree
rmtree = dir_util.remove_tree


class Profile(object):
    """Handles all operations regarding profile. Created new profiles, installs extensions,
    sets preferences and handles cleanup."""

    def __init__(self, profile=None, addons=None, addon_manifests=None, preferences=None, restore=True):
        # if true, remove installed addons/prefs afterwards
        self.restore = restore

        # Handle profile creation
        self.create_new = not profile
        if profile:
            # Ensure we have a full path to the profile
            self.profile = os.path.expanduser(profile)
        else:
            self.profile = self.create_new_profile()

        # set preferences from class preferences
        if hasattr(self.__class__, 'preferences'):
            self.preferences = self.__class__.preferences.copy()
        else:
            self.preferences = {}
        self.preferences.update(preferences or {})
        self.set_preferences(self.preferences)
 
        # handle addon installation
        self.addon_manager = AddonManager(self.profile)
        self.addon_manager.install_addons(addons, addon_manifests)

    def reset(self):
        """
        reset the profile to the beginning state
        """
        self.cleanup()
        if self.create_new:
            profile = None 
        else:
            profile = self.profile
        self.__init__(profile=profile, addons=self.addon_manager.addons,
                      addon_manifests=self.addon_manager.manifests, preferences=self.preferences)
    def create_new_profile(self):
        """Create a new clean profile in tmp which is a simple empty folder"""
        profile = tempfile.mkdtemp(suffix='.mozrunner')
        return profile


    ### methods for preferences

    def set_preferences(self, preferences):
        """Adds preferences dict to profile preferences"""
        
        prefs_file = os.path.join(self.profile, 'user.js')
        
        # Ensure that the file exists first otherwise create an empty file
        if os.path.isfile(prefs_file):
            f = open(prefs_file, 'a+')
        else:
            f = open(prefs_file, 'w')

        f.write('\n#MozRunner Prefs Start\n')

        pref_lines = ['user_pref(%s, %s);' %
                      (simplejson.dumps(k), simplejson.dumps(v) ) for k, v in
                       preferences.items()]
        for line in pref_lines:
            f.write(line+'\n')
        f.write('#MozRunner Prefs End\n')
        f.flush() ; f.close()

    def clean_preferences(self):
        """Removed preferences added by mozrunner."""
        lines = open(os.path.join(self.profile, 'user.js'), 'r').read().splitlines()
        s = lines.index('#MozRunner Prefs Start') ; e = lines.index('#MozRunner Prefs End')
        cleaned_prefs = '\n'.join(lines[:s] + lines[e+1:])
        f = open(os.path.join(self.profile, 'user.js'), 'w')
        f.write(cleaned_prefs) ; f.flush() ; f.close()

    ### cleanup
 
    def cleanup(self):
        """Cleanup operations on the profile."""
        if self.restore:
            if self.create_new:
                if os.path.exists(self.profile):
                    rmtree(self.profile)
            else:
                self.clean_preferences()
                self.addon_manager.clean_addons()

    __del__ = cleanup

class FirefoxProfile(Profile):
    """Specialized Profile subclass for Firefox"""
    preferences = {# Don't automatically update the application
                   'app.update.enabled' : False,
                   # Don't restore the last open set of tabs if the browser has crashed
                   'browser.sessionstore.resume_from_crash': False,
                   # Don't check for the default web browser
                   'browser.shell.checkDefaultBrowser' : False,
                   # Don't warn on exit when multiple tabs are open
                   'browser.tabs.warnOnClose' : False,
                   # Don't warn when exiting the browser
                   'browser.warnOnQuit': False,
                   # Only install add-ons from the profile and the app folder
                   'extensions.enabledScopes' : 5,
                   # Dont' run the add-on compatibility check during start-up
                   'extensions.showMismatchUI' : False,
                   # Don't automatically update add-ons
                   'extensions.update.enabled'    : False,
                   # Don't open a dialog to show available add-on updates
                   'extensions.update.notifyUser' : False,

                   # Disable addon compatibility checks
                   'extensions.checkCompatibility' : False,
                   'extensions.checkCompatibility.4.0' : False,
                   'extensions.checkCompatibility.4.0b' : False,
                   'extensions.checkCompatibility.4.2' : False,
                   'extensions.checkCompatibility.4.2a' : False,
                   'extensions.checkCompatibility.4.2b' : False,
                   'extensions.checkCompatibility.4.2pre' : False,
                   'extensions.checkCompatibility.5.0' : False,
                   'extensions.checkCompatibility.5.0a' : False,
                   'extensions.checkCompatibility.5.0b' : False,
                   'extensions.checkCompatibility.5.0pre' : False,
                   'extensions.checkCompatibility.6.0' : False,
                   'extensions.checkCompatibility.6.0a' : False,
                   'extensions.checkCompatibility.6.0b' : False,
                   'extensions.checkCompatibility.6.0pre' : False,
                   }

class ThunderbirdProfile(Profile):
    preferences = {'extensions.update.enabled'    : False,
                   'extensions.update.notifyUser' : False,
                   'browser.shell.checkDefaultBrowser' : False,
                   'browser.tabs.warnOnClose' : False,
                   'browser.warnOnQuit': False,
                   'browser.sessionstore.resume_from_crash': False,
                   }
