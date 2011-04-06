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
# The Original Code is Mozprofile.
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

import urllib2
import os
import sys
import tempfile
import zipfile
from xml.dom import minidom
from manifestparser import ManifestParser
from distutils import dir_util

# Needed for the AMO's rest API - https://developer.mozilla.org/en/addons.mozilla.org_%28AMO%29_API_Developers%27_Guide/The_generic_AMO_API
AMO_API_VERSION = "1.5"

class AddonManager(object):
    """
    Handles all operations regarding addons including: installing and cleaning addons
    """

    def __init__(self, profile):
        """
        profile - the path to the profile for which we install addons
        """
        self.profile = profile
        self.installed_addons = []
        # keeps track of addons and manifests that were passed to install_addons
        self.addons = []
        self.manifests = []
        

    def install_addons(self, addons=None, manifests=None):
        """
        Installs all types of addons
        addons - a list of addon paths to install
        manifest - a list of addon manifests to install
        """
        # install addon paths
        if addons:
            if isinstance(addons, basestring):
                addons = [addons]
            for addon in addons:
                self.install_from_path(addon)
        # install addon manifests
        if manifests:
            if isinstance(manifests, basestring):
                manifests = [manifests]
            for manifest in manifests:
                self.install_from_manifest(manifest)
        

    def install_from_manifest(self, filepath):
        """
        Installs addons from a manifest
        filepath - path to the manifest of addons to install
        """
        self.manifests.append(filepath)
        manifest = ManifestParser()
        manifest.read(filepath)
        addons = manifest.get()

        for addon in addons:
            if '://' in addon['path'] or os.path.exists(addon['path']):
                self.install_from_path(addon['path'])
                continue

            # No path specified, try to grab it off AMO
            locale = addon.get('amo_locale', 'en_US')
    
            query = 'https://services.addons.mozilla.org/' + locale + '/firefox/api/' + AMO_API_VERSION + '/'
            if 'amo_id' in addon:
                query += 'addon/' + addon['amo_id']                 # this query grabs information on the addon base on its id
            else:
                query += 'search/' + addon['name'] + '/default/1'   # this query grabs information on the first addon returned from a search
            install_path = AddonManager.get_amo_install_path(query)
            self.install_from_path(install_path)

    @classmethod
    def get_amo_install_path(self, query):
        """
        Return the addon xpi install path for the specified AMO query. 
        See: https://developer.mozilla.org/en/addons.mozilla.org_%28AMO%29_API_Developers%27_Guide/The_generic_AMO_API
        for query documentation.
        """
        response = urllib2.urlopen(query)
        dom = minidom.parseString(response.read())
        for node in dom.getElementsByTagName('install')[0].childNodes:
            if node.nodeType == node.TEXT_NODE:
                return node.data
 
    @classmethod
    def get_addon_id(self, addon_path):
        """
        return the id for a given addon, or None if not found
        - addon_path : path to the addon directory
        """
        
        def find_id(desc):
            """finds the addon id give its description"""
            
            addon_id = None
            for elem in desc:
                apps = elem.getElementsByTagName('em:targetApplication')
                apps.extend(elem.getElementsByTagName('targetApplication'))
                if apps:
                    for app in apps:
                        # remove targetApplication nodes, they contain id's we aren't interested in
                        elem.removeChild(app)

                    # find the id tag
                    if elem.getElementsByTagName('em:id'):
                        addon_id = str(elem.getElementsByTagName('em:id')[0].firstChild.data)
                    elif elem.hasAttribute('em:id'):
                        addon_id = str(elem.getAttribute('em:id'))
                    elif elem.getElementsByTagName('id'):
                        addon_id = str(elem.getElementsByTagName('id')[0].firstChild.data)
                    
            return addon_id

        doc = minidom.parse(os.path.join(addon_path, 'install.rdf')) 

        for tag in 'Description', 'RDF:Description':
            desc = doc.getElementsByTagName(tag)
            addon_id = find_id(desc)
            if addon_id:
                return addon_id

    def install_from_path(self, path):
        """
        Installs addon from a filepath, url 
        or directory of addons in the profile.
        """
        self.addons.append(path)

        # if the addon is a url, download it
        # note that this won't work with protocols urllib2 doesn't support
        if '://' in path:
            response = urllib2.urlopen(path)
            fd, path = tempfile.mkstemp(suffix='.xpi')
            os.write(fd, response.read())
            os.close(fd)
            tmpfile = path
        else:
            tmpfile = None

        # if the addon is a directory, install all addons in it
        addons = [path]
        if not path.endswith('.xpi') and not os.path.exists(os.path.join(path, 'install.rdf')):
            assert os.path.isdir(path)
            addons = [os.path.join(path, x) for x in os.listdir(path)]

        # install each addon
        for addon in addons:
            tmpdir = None
            if addon.endswith('.xpi'):
                tmpdir = tempfile.mkdtemp(suffix = '.' + os.path.split(addon)[-1])
                compressed_file = zipfile.ZipFile(addon, 'r')
                for name in compressed_file.namelist():
                    if name.endswith('/'):
                        os.makedirs(os.path.join(tmpdir, name))
                    else:
                        if not os.path.isdir(os.path.dirname(os.path.join(tmpdir, name))):
                            os.makedirs(os.path.dirname(os.path.join(tmpdir, name)))
                        data = compressed_file.read(name)
                        f = open(os.path.join(tmpdir, name), 'wb')
                        f.write(data)
                        f.close()
                addon = tmpdir

            # determine the addon id
            addon_id = AddonManager.get_addon_id(addon)
            assert addon_id is not None, 'The addon id could not be found: %s' % addon
 
            # copy the addon to the profile
            addon_path = os.path.join(self.profile, 'extensions', addon_id)
            dir_util.copy_tree(addon, addon_path, preserve_symlinks=1)
            self.installed_addons.append(addon_path)

            # remove the temporary directory, if any
            if tmpdir:
                dir_util.remove_tree(tmpdir)

        # remove temporary file, if any
        if tmpfile:
            os.remove(tmpfile)
    
    def clean_addons(self):
        """Cleans up addons in the profile."""
        for addon in self.installed_addons:
            if os.path.isdir(addon):
                dir_util.remove_tree(addon)
