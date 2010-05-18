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

import copy
import mozmill

class MozmillWrapperCLI(mozmill.CLI):
    """ Wrapper class for the Mozmill CLI class. """

    # This is really bad but we have to declare all possible cli options.
    # Otherwise the mozmill.CLI parser is failing.
    # XXX: Can be removed once we do not have to depend on the CLI class anymore
    #      See bug 565733 for the refactoring work.
    parser_options = copy.copy(mozmill.CLI.parser_options)
    parser_options[("--channel",)] = dict(dest="channel")
    parser_options[("--no-fallback",)] = dict(dest="no_fallback")

    def __init__(self, *args, **kwargs):
        mozmill.CLI.__init__(self, *args, **kwargs)

    def _get_addon_list(self):
        """ Returns the location of add-ons which will be installed. """
        return self.addons

    def _set_addon_list(self, value):
        """ Sets the location of add-ons which will be installed. """
        self.addons = value

    addon_list = property(_get_addon_list, _set_addon_list, None)

    def _get_binary(self):
        """ Returns the binary to use for testing. """
        return self.options.binary

    def _set_binary(self, value):
        """ Sets the binary to use for testing. """
        self.options.binary = value

    binary = property(_get_binary, _set_binary, None)

    def _get_debug(self):
        """ Returns the enabled state of the debug mode. """
        return self.options.debug

    def _set_debug(self, value):
        """ Sets the enabled state of the debug mode. """
        self.options.debug = value

    debug = property(_get_debug, _set_debug, None)

    def _get_fails(self):
        """ Returns the failed tests. """
        return self.mozmill.fails

    fails = property(_get_fails, None, None)

    def _get_log_file(self):
        """ Returns the path of the log file. """
        return self.options.logfile

    def _set_log_file(self, value):
        """ Sets the path of the log file. """
        self.options.logfile = value

    log_file = property(_get_log_file, _set_log_file, None)

    def _get_passes(self):
        """ Returns the passed tests. """
        return self.mozmill.passes

    passes = property(_get_passes, None, None)

    def _get_persisted(self):
        """ Returns the path of the profile to use. """
        return self.mozmill.persisted

    def _set_persisted(self, value):
        """ Sets the path of the profile to use. """
        self.mozmill.persisted = value

    persisted = property(_get_persisted, _set_persisted, None)

    def _get_port(self):
        """ Returns the TCP port for jsbridge. """
        return self.options.port

    def _set_port(self, value):
        """ Sets the TCP port for jsbridge. """
        self.options.port = value

    port = property(_get_port, _set_port, None)

    def _get_profile(self):
        """ Returns the path of the profile to use. """
        return self.options.profile

    def _set_profile(self, value):
        """ Sets the path of the profile to use. """
        self.options.profile = value
        self.options.create_new = value is None

    profile = property(_get_profile, _set_profile, None)

    def _get_report_url(self):
        """ Returns the URL of the report server. """
        return self.options.report

    def _set_report_url(self, value):
        """ Sets the URL of the report server. """
        self.options.report = value

    report_url = property(_get_report_url, _set_report_url, None)

    def _get_shell(self):
        """ Returns if a Python shell has to be started. """
        return self.options.shell

    def _set_shell(self, value):
        """ Sets if a Python shell has to be started. """
        self.options.shell = value

    shell = property(_get_shell, _set_shell, None)

    def _get_show_all(self):
        """ Returns if complete test output is wanted. """
        return self.options.showall

    def _set_show_all(self, value):
        """ Sets if complete test output is wanted. """
        self.options.showall = value

    show_all = property(_get_show_all, _set_show_all, None)

    def _get_showerrors(self):
        """ Returns if extended error output is wanted. """
        return self.options.showerrors

    def _set_showerrors(self, value):
        """ Sets if extended error output is wanted. """
        self.options.showerrors = value

    showerrors = property(_get_showerrors, _set_showerrors, None)

    def _get_skipped(self):
        """ Returns the skipped tests. """
        return self.mozmill.skipped

    skipped = property(_get_skipped, None, None)

    def _get_test(self):
        """ Returns the location of the tests. """
        return self.options.test

    def _set_test(self, value):
        """ Sets the location of the tests. """
        self.options.test = value

    test = property(_get_test, _set_test, None)

    def _get_use_code(self):
        """ Returns if the code module should be used. """
        return self.options.usecode

    def _set_use_code(self, value):
        """ Sets if the code module should be used. """
        self.options.usecode = value

    use_code = property(_get_use_code, _set_use_code, None)

    def run(self, *args, **kwargs):
        """ Start the test-run. """
        mozmill.CLI._run(self, *args, **kwargs)


class MozmillWrapperRestartCLI(mozmill.RestartCLI, MozmillWrapperCLI):
    """ Wrapper class for the Mozmill RestartCLI class. """

    parser_options = copy.copy(MozmillWrapperCLI.parser_options)

    def run(self, *args, **kwargs):
        """ Starts the test-run. """
        mozmill.RestartCLI._run(self, *args, **kwargs)
