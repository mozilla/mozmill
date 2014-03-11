# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, you can obtain one at http://mozilla.org/MPL/2.0/.

try:
    import json
except ImportError:
    import simplejson as json

import datetime
import platform
import sys
import urllib2

import mozinfo

from handlers import HandlerMatchException


# Due to an issue in urllib2 on mac we get EAGAIN (Errno 35) exception when
# sending bigger reports. Fix from:
# https://github.com/shazow/urllib3/issues/63#issuecomment-15447770
if mozinfo.isMac and '10.6' in mozinfo.version:
    # Monkey patch socket.sendall to handle EAGAIN (Errno 35) on mac.
    import errno
    import socket
    import time

    def socket_sendall(self, data):
        while len(data) > 0:
            try:
                bytes_sent = self.send(data)
                data = data[bytes_sent:]
            except socket.error, e:
                if e.errno == errno.EAGAIN:
                    time.sleep(0.1)
                else:
                    raise e

    socket._socketobject.sendall = socket_sendall


class Report(object):
    def __init__(self, report, date_format="%Y-%m-%dT%H:%M:%SZ"):
        if not isinstance(report, basestring):
            raise HandlerMatchException
        self.report = report
        self.date_format = date_format

    def events(self):
        """Returns a mapping of event types (strings) to methods."""
        return {}

    @classmethod
    def add_options(cls, parser):
        """Add options to the parser."""
        parser.add_option("--report",
                          dest="report",
                          default=None,
                          metavar='URL',
                          help="Report the results. Requires URL to results "
                               "server. Use 'stdout' for stdout.")

    def stop(self, results, fatal=False):
        results = self.get_report(results)
        return self.send_report(results, self.report)

    def get_report(self, results):
        """Get the report results."""

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

        if results.appinfo:
            report.update(results.appinfo)

        report['system_info'] = {"bits": str(mozinfo.bits),
                                 "hostname": platform.node(),
                                 "processor": mozinfo.processor,
                                 "service_pack": getattr(mozinfo,
                                                         'service_pack', ''),
                                 "system": mozinfo.os.title(),
                                 "version": mozinfo.version
        }

        return report

    def send_report(self, results, report_url):
        """Send a report of the results to a CouchdB instance or a file."""

        # report to file or stdout
        f = None
        if report_url == 'stdout':
            f = sys.stdout
        if report_url.startswith('file://'):
            filename = report_url.split('file://', 1)[1]
            try:
                f = file(filename, 'w')
            except Exception as e:
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

            # Send a POST request to the DB.
            # The POST is implied by the body data
            body = json.dumps(results)
            request = urllib2.Request(report_url, body,
                                      {"Content-Type": "application/json"})

            # Get response which contains the id of the new document
            response = urllib2.urlopen(request, timeout=30)
            data = json.loads(response.read())

            # Print document location to the console and return
            print "Report document created at '%s%s'" % (report_url,
                                                         data['id'])
            return data
        except urllib2.HTTPError as e:
            try:
              data = json.loads(e.read())
              print "Sending results to '%s' failed (%s)." % (report_url,
                                                              data['reason'])
            except ValueError:
              print "Sending results to '%s' failed (%s)." % (report_url,
                                                              str(e))
        except urllib2.URLError as e:
            print "Sending results to '%s' failed (%s)." % (report_url,
                                                            e.reason)
        except Exception as e:
            print "Sending results to '%s' failed (%s)." % (report_url,
            str(e))
