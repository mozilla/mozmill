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

from mercurial import commands, hg, ui
import os
import re
import shutil

class Repository(object):
    """ Class to access a Mercurial repository. """

    def __init__(self, url, destination=None):
        self._repository = None
        self._ui = ui.ui()
        self._url = url
        self.destination = destination

    @property
    def exists(self):
        """ Checks if the local copy of the repository exists (read-only). """
        return self._repository is not None

    @property
    def url(self):
        """ Returns the remote location of the repository (read-only). """
        return self._url

    def get_branch(self):
        """ Returns the selected branch. """
        if self._repository:
            return self._repository.dirstate.branch()

    def set_branch(self, value):
        """ Updates the code to the specified branch. """
        self.update(value)

    branch = property(get_branch, set_branch, None)

    def get_destination(self):
        """ Returns the local destination of the repository. """
        return self._destination

    def set_destination(self, value):
        """ Sets the location destination of the repository. """
        try:
            self._destination = value
            self._repository = hg.repository(ui.ui(), self._destination)
        except:
            self._repository = None

    destination = property(get_destination, set_destination, None)

    def clone(self, destination=None):
        """ Clone the repository to the local disk. """
        if destination is not None:
            self.destination = destination

        print "*** Cloning repository to '%s'" % self.destination
        hg.clone(ui.ui(), self.url, self.destination, True)
        self._repository = hg.repository(ui.ui(), self.destination)

    def identify_branch(self, gecko_branch):
        """ Identify the mozmill-tests branch from the gecko branch. """
        try:
            m = re.search('(?<=-)([\d\.]+)', gecko_branch)
            branch = 'mozilla' + m.group(0)
        except:
            branch = 'default'

        return branch

    def update(self, branch=None):
        """ Update the local repository for recent changes. """
        if branch is None:
            branch = self.branch

        print "*** Updating to branch '%s'" % branch
        commands.pull(ui.ui(), self._repository, self.url)
        commands.update(ui.ui(), self._repository, None, branch, True)

    def remove(self):
        """ Remove the local version of the repository. """
        print "*** Removing repository '%s'" % self.destination
        shutil.rmtree(self.destination)
        self.destination = None
