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
import sys
import tempfile
import zipfile
from xml.etree import ElementTree

from utils import makedirs

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

    def __init__(self, binary=None, profile=None, addons=None,
                 preferences=None):

        self.binary = binary

        self.create_new = not(bool(profile))
        if profile:
            self.profile = profile
        else:
            self.profile = self.create_new_profile(self.binary)

        self.addons_installed = []
        self.addons = addons or []

        ### set preferences from class preferences
        preferences = preferences or {}
        if hasattr(self.__class__, 'preferences'):
            self.preferences = self.__class__.preferences.copy()
        else:
            self.preferences = {}
        self.preferences.update(preferences)

        for addon in self.addons:
            self.install_addon(addon)

        self.set_preferences(self.preferences)

    def create_new_profile(self, binary):
        """Create a new clean profile in tmp which is a simple empty folder"""
        profile = tempfile.mkdtemp(suffix='.mozrunner')
        return profile

    def install_addon(self, path):
        """Installs the given addon or directory of addons in the profile."""
        addons = [path]
        if not path.endswith('.xpi') and not os.path.exists(os.path.join(path, 'install.rdf')):
            addons = [os.path.join(path, x) for x in os.listdir(path)]
           
        for addon in addons:
            tmpdir = None
            if addon.endswith('.xpi'):
                tmpdir = tempfile.mkdtemp(suffix = "." + os.path.split(addon)[-1])
                compressed_file = zipfile.ZipFile(addon, "r")
                for name in compressed_file.namelist():
                    if name.endswith('/'):
                        makedirs(os.path.join(tmpdir, name))
                    else:
                        if not os.path.isdir(os.path.dirname(os.path.join(tmpdir, name))):
                            makedirs(os.path.dirname(os.path.join(tmpdir, name)))
                        data = compressed_file.read(name)
                        f = open(os.path.join(tmpdir, name), 'wb')
                        f.write(data) ; f.close()
                addon = tmpdir

            tree = ElementTree.ElementTree(file=os.path.join(addon, 'install.rdf'))
            # description_element =
            # tree.find('.//{http://www.w3.org/1999/02/22-rdf-syntax-ns#}Description/')

            desc = tree.find('.//{http://www.w3.org/1999/02/22-rdf-syntax-ns#}Description')
            apps = desc.findall('.//{http://www.mozilla.org/2004/em-rdf#}targetApplication')
            for app in apps:
              desc.remove(app)
            if len(desc) and desc.attrib.has_key('{http://www.mozilla.org/2004/em-rdf#}id'):
                addon_id = desc.attrib['{http://www.mozilla.org/2004/em-rdf#}id']
            elif len(desc) and desc.find('.//{http://www.mozilla.org/2004/em-rdf#}id') is not None:
                addon_id = desc.find('.//{http://www.mozilla.org/2004/em-rdf#}id').text
            else:
                about = [e for e in tree.findall(
                            './/{http://www.w3.org/1999/02/22-rdf-syntax-ns#}Description') if
                             e.get('{http://www.w3.org/1999/02/22-rdf-syntax-ns#}about') ==
                             'urn:mozilla:install-manifest'
                        ]

                x = e.find('.//{http://www.w3.org/1999/02/22-rdf-syntax-ns#}Description')

                if len(about) == 0:
                    addon_element = tree.find('.//{http://www.mozilla.org/2004/em-rdf#}id')
                    addon_id = addon_element.text
                else:
                    addon_id = about[0].get('{http://www.mozilla.org/2004/em-rdf#}id')

            addon_path = os.path.join(self.profile, 'extensions', addon_id)
            copytree(addon, addon_path, preserve_symlinks=1)
            self.addons_installed.append(addon_path)

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

    def clean_addons(self):
        """Cleans up addons in the profile."""
        for addon in self.addons_installed:
            if os.path.isdir(addon):
                rmtree(addon)

    def cleanup(self):
        """Cleanup operations on the profile."""
        if self.create_new:
            rmtree(self.profile)
        else:
            self.clean_preferences()
            self.clean_addons()

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
                   # Don't automatically update add-ons
                   'extensions.update.enabled'    : False,
                   # Don't open a dialog to show available add-on updates
                   'extensions.update.notifyUser' : False,
                   }

    @property
    def names(self):
        if sys.platform == 'darwin':
            return ['firefox', 'minefield', 'shiretoko']
        if (sys.platform == 'linux2') or (sys.platform in ('sunos5', 'solaris')):
            return ['firefox', 'mozilla-firefox', 'iceweasel']
        if os.name == 'nt' or sys.platform == 'cygwin':
            return ['firefox']

class ThunderbirdProfile(Profile):
    preferences = {'extensions.update.enabled'    : False,
                   'extensions.update.notifyUser' : False,
                   'browser.shell.checkDefaultBrowser' : False,
                   'browser.tabs.warnOnClose' : False,
                   'browser.warnOnQuit': False,
                   'browser.sessionstore.resume_from_crash': False,
                   }
    names = ["thunderbird", "shredder"]


