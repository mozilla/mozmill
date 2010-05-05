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

import os
import re
import shutil
import tempfile

from mercurial import commands, hg, ui

class Repository(object):

    def __init__(self, url, destination = None):
        self._repository = None
        self._ui = ui.ui()
        self._url = url
        self.destination = destination

    ''' Check if the local copy exists (get)'''
    @property
    def exists(self):
        return self._repository is not None

    ''' Remote location of the repository (get)'''
    @property
    def url(self):
        return self._url

    ''' Selected branch (get|set)'''
    def get_branch(self):
        if self._repository:
            return self._repository.dirstate.branch()

    def set_branch(self, value):
        self.update(value)

    branch = property(get_branch, set_branch, None)

    ''' Local destination of the repository (get|set)'''
    def get_destination(self):
        return self._destination

    def set_destination(self, value):
        self._destination = value

        # Try to initialize the repository at the new location
        try:
            self._repository = hg.repository(ui.ui(), self._destination)
        except:
            self._repository = None

    destination = property(get_destination, set_destination, None)

    ''' Clone the repository '''
    def clone(self, destination = None):
        if destination is not None:
            self.destination = destination

        print "cloning repository to %s" % self.destination
        hg.clone(ui.ui(), self.url, self.destination, True)
        self._repository = hg.repository(ui.ui(), self.destination)

    ''' Identify the needed mozmill-tests branch from the application branch '''
    def identify_branch(self, gecko_branch):
        try:
            m = re.search('(?<=-)([\d\.]+)', gecko_branch)
            branch = 'mozilla' + m.group(0)
        except:
            branch = 'default'

        return branch

    ''' Update the local repository '''
    def update(self, branch = None):
        if branch is None:
            branch = self.branch

        print "updating to branch %s" % branch
        commands.pull(ui.ui(), self._repository, self.url)
        commands.update(ui.ui(), self._repository, None, branch, True)

    ''' Remove the local version of the repository '''
    def remove(self):
        print "removing repository %s" % self.destination
        shutil.rmtree(self.destination)
