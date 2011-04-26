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

import httplib
import sys
import urllib
import urlparse
import datetime

try:
  import json
except:
  import simplejson as json

from info import get_platform_information
from handlers import HandlerMatchException

class Report(object):

  def __init__(self, report, date_format="%Y-%m-%dT%H:%M:%SZ"):
    if not isinstance(report, basestring):
      raise HandlerMatchException
    self.report = report
    self.date_format = date_format

  def events(self):
    """returns a mapping of event types (strings) to methods"""
    return {}

  @classmethod
  def add_options(cls, parser):
    """add options to the parser"""
    parser.add_option("--report", dest="report",
                      default=None, metavar='URL',
                      help="Report the results. Requires url to results server. Use 'stdout' for stdout.")

  def stop(self, results, fatal=False):
    results = self.get_report(results)
    return self.send_report(results, self.report)

  def get_report(self, results):
    """get the report results"""

    report = {'report_type': 'mozmill-test',
              'mozmill_version': results.mozmill_version,
              'time_start': results.starttime.strftime(self.date_format),
              'time_end': results.endtime.strftime(self.date_format),
              'time_upload': 'n/a',
              'tests_passed': len(results.passes),
              'tests_failed': len(results.fails),
              'tests_skipped': len(results.skipped),
              'results': results.alltests,
              'screenshots': results.screenshots,
              }

    report.update(results.appinfo)
    report['system_info'] = get_platform_information()
    
    return report

  def send_report(self, results, report_url):
    """ Send a report of the results to a CouchdB instance or a file. """

    # report to file or stdout
    f = None
    if report_url == 'stdout': # stdout
        f = sys.stdout
    if report_url.startswith('file://'):
        filename = report_url.split('file://', 1)[1]
        try:
            f = file(filename, 'w')
        except Exception, e:
            print "Printing results to '%s' failed (%s)." % (filename, e)
            return
    if f:
        print >> f, json.dumps(results)
        return

    # report to CouchDB
    try:
        # Set the upload time of the report
        now = datetime.datetime.utcnow()
        results['time_upload'] = now.strftime(self.date_format)

        # Parse URL fragments and send data
        url_fragments = urlparse.urlparse(report_url)
        connection = httplib.HTTPConnection(url_fragments.netloc)
        connection.request("POST", url_fragments.path, json.dumps(results),
                           {"Content-type": "application/json"})
        
        # Get response which contains the id of the new document
        response = connection.getresponse()
        data = json.loads(response.read())
        connection.close()

        # Check if the report has been created
        if not data['ok']:
            print "Creating report document failed (%s)" % data
            return data

        # Print document location to the console and return
        print "Report document created at '%s/%s'" % (report_url, data['id'])
        return data
    except Exception, e:
        print "Sending results to '%s' failed (%s)." % (report_url, e)


    
