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
# Portions created by the Initial Developer are Copyright (C) 2008
# the Initial Developer. All Rights Reserved.
#
# Contributor(s):
#  Mikeal Rogers <mikeal.rogers@gmail.com>
#  Henrik Skupin <hskupin@mozilla.com>
#  Clint Talbert <ctalbert@mozilla.com>
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

import platform
import re


def get_platform_information():
  """
  Retrieves platform information for test reports. Parts of that code
  come from the dirtyharry application:
  http://github.com/harthur/dirtyharry/blob/master/dirtyutils.py """
  # XXX this code should be extracted out to an additional package
  # to gather information (mozinfo?)


  (system, node, release, version, machine, processor) = platform.uname()
  (bits, linkage) = platform.architecture()
  service_pack = ''

  if system in ["Microsoft", "Windows"]:
    # There is a Python bug on Windows to determine platform values
    # http://bugs.python.org/issue7860
    if "PROCESSOR_ARCHITEW6432" in os.environ:
      processor = os.environ.get("PROCESSOR_ARCHITEW6432", processor)
    else:
      processor = os.environ.get('PROCESSOR_ARCHITECTURE', processor)
      system = os.environ.get("OS", system).replace('_', ' ')
      service_pack = os.sys.getwindowsversion()[4]
  elif system == "Linux":
    (distro, version, codename) = platform.linux_distribution()
    version = distro + " " + version
    if not processor:
      processor = machine
  elif system == "Darwin":
    system = "Mac"
    (release, versioninfo, machine) = platform.mac_ver()
    version = "OS X " + release

  if processor in ["i386", "i686"]:
    if bits == "32bit":
      processor = "x86"
    elif bits == "64bit":
      processor = "x86_64"
  elif processor == "AMD64":
    bits = "64bit"
    processor = "x86_64"
  elif processor == "Power Macintosh":
    processor = "ppc"

  bits = re.search('(\d+)bit', bits).group(1)

  _platform = {'hostname': node,
               'system': system,
               'version': version,
               'service_pack': service_pack,
               'processor': processor,
               'bits': bits
               }
  
  return _platform
