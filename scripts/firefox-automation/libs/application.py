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

import ConfigParser
import os
import re
import sys

def get_bin_folder(app_folder):
    """ Returns the folder which contains the binaries of the application. """
    if sys.platform in ("darwin"):
        app_folder = os.path.join(app_folder, 'Contents', 'MacOS')
    return app_folder

def get_binary(app_folder):
    """ Returns the binary given by the curent platform. """

    if sys.platform in ("cygwin", "win32"):
        path = "firefox.exe"
    elif sys.platform in ("darwin"):
        path = ""
    elif sys.platform in ("linux2", "sunos5"):
        path = "firefox"

    return os.path.join(app_folder, path)

def is_app_folder(path):
    """ Checks if the folder is an application folder. """
    file = os.path.join(get_bin_folder(path),
                        "application.ini")

    return os.path.exists(file)

class ApplicationIni(object):
    """ Class to retrieve entries from the application.ini file. """

    def __init__(self, folder):
        self.ini_file = os.path.join(get_bin_folder(folder), 'application.ini')

        self.config = ConfigParser.RawConfigParser()
        self.config.read(self.ini_file)

    def get(self, section, option):
        """ Retrieve the value of an entry. """
        return self.config.get(section, option)

class UpdateChannel(object):
    """ Class to handle the update channel. """

    # List of available update channels
    channels = ["betatest", "beta", "nightly", "releasetest", "release"]

    def _get_folder(self):
        """ Returns the applications folder. """
        return self._folder

    def _set_folder(self, value):
        """ Sets the applications folder. """
        self._folder = value

    folder = property(_get_folder, _set_folder, None)

    def _get_pref_folder(self):
        """ Returns the default preferences folder. """
        pref_path = ('defaults', 'pref', 'channel-prefs.js')
        return os.path.join(get_bin_folder(self.folder), *pref_path)

    pref_folder = property(_get_pref_folder, None, None)

    def isValidChannel(self, channel):
        """ Checks if the update channel is valid. """
        try:
            self.channels.index(channel);
            return True
        except:
            return False

    def _get_channel(self):
        """ Returns the current update channel. """
        try:
            file = open(self.pref_folder, "r")
        except IOError, e:
            raise e
        else:
            content = file.read()
            file.close()

            result = re.search(r"(" + '|'.join(self.channels) + ")", content)
            return result.group(0)

    def _set_channel(self, value):
        """ Sets the update channel. """

        print "Setting update channel to '%s'..." % value

        if not self.isValidChannel(value):
            raise Exception("%s is not a valid update channel" % value)

        try:
            file = open(self.pref_folder, "r")
        except IOError, e:
            raise e
        else:
            # Replace the current update channel with the specified one
            content = file.read()
            file.close()

            # Replace the current channel with the specified one
            result = re.sub(r"(" + '|'.join(self.channels) + ")",
                            value, content)

            try:
                file = open(self.pref_folder, "w")
            except IOError, e:
                raise e
            else:
                file.write(result)
                file.close()

                # Check that the correct channel has been set
                if value != self.channel:
                    raise Exception("Update channel wasn't set correctly.")

    channel = property(_get_channel, _set_channel, None)
