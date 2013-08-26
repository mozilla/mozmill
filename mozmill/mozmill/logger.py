# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, you can obtain one at http://mozilla.org/MPL/2.0/.

"""Logging event listener for Mozmill."""

try:
    import json
except:
    import simplejson as json

import logging
import re
import sys
import uuid

from datetime import datetime

class LoggerListener(object):
    stack_regex = re.compile("(.*)@(.*?)(?: -> (file\:\/\/\/\S*))?\:(\d*)$")
    name = 'Logging'

    ### methods for the EventHandler interface
    def __init__(self, log_file=None, console_level="INFO", file_level="INFO",
                 format="pprint-color", debug=False, console_stream=sys.stdout):
        self.format = format
        self.debug = debug
        self.mozmill = None

        template = "%(levelname)s | %(message)s"

        levels = {
            "CRITICAL": logging.CRITICAL,  # 50
            "ERROR": logging.ERROR,  # 40
            "WARNING": logging.WARNING,  # 30
            "INFO": logging.INFO,  # 20
            "DEBUG": logging.DEBUG,  # 10
        }

        self.custom_levels = {
            "RESULTS": 1000,
            "TEST-UNEXPECTED-PASS": 43,
            "TEST-UNEXPECTED-FAIL": 42,
            "TEST-SKIPPED": 31,
            "TEST-END": 24,
            "TEST-KNOWN-FAIL": 23,
            "TEST-PASS": 22,
            "TEST-START": 21,
            }

        for name in self.custom_levels:
            logging.addLevelName(self.custom_levels[name], name)

        self.logger = logging.getLogger('mozmill.%s' % uuid.uuid1())
        self.logger.setLevel(logging.DEBUG)
        formatter = logging.Formatter(template)

        use_indent = format in ["pprint", "pprint-color"]
        print_stack = console_level not in ["WARNING", "INFO"]
        console = logging.StreamHandler(console_stream)
        use_color = (format == "pprint-color")
        formatter = ColorFormatter(template, use_color=use_color, print_stack=print_stack, use_indent=use_indent)
        console.setFormatter(formatter)
        console.setLevel(levels[console_level])
        self.logger.addHandler(console)

        if log_file:
            print_stack = file_level not in ["WARNING", "INFO"]
            handler = logging.FileHandler(log_file, 'w')
            formatter = ColorFormatter(template, use_color=use_color, print_stack=print_stack, use_indent=use_indent)
            handler.setFormatter(formatter)
            handler.setLevel(levels[file_level])
            self.logger.addHandler(handler)

    class StdOutLogger(object):
        def __init__(self, logger):
            self.logger = logger

        def write(self, str):
            self.logger.info(str.rstrip())

        def flush(self):
            # We don't keep any state, so this just needs to be here
            # so the python distutils stuff can call us.
            pass

    class StdErrLogger(object):
        def __init__(self, logger):
            self.logger = logger

        def write(self, str):
            self.logger.error(str.rstrip())

        def flush(self):
            # We don't keep any state, so this just needs to be here
            # so the python distutils side can call us.
            pass

    @classmethod
    def add_options(cls, parser):
        LOG_LEVELS = ("CRITICAL", "ERROR", "WARNING", "INFO", "DEBUG")
        LEVEL_STRING = "[" + "|".join(LOG_LEVELS) + "]"

        parser.add_option("-l", "--log-file",
                          dest="log_file",
                          default=None,
                          help="Log all events to file.")
        parser.add_option("--console-level",
                          dest="console_level",
                          default="INFO",
                          action="store",
                          type="choice",
                          choices=LOG_LEVELS,
                          metavar=LEVEL_STRING,
                          help="level of console logging (default: %default)",
                          )
        parser.add_option("--file-level",
                          dest="file_level",
                          default="INFO",
                          action="store",
                          type="choice",
                          choices=LOG_LEVELS,
                          metavar=LEVEL_STRING,
                          help="Level of file logging if --log-file "
                               "has been specified (default: %default)",
                          )
        parser.add_option("--format",
                          dest="format",
                          default="pprint-color",
                          metavar="[json|pprint|pprint-color]",
                          help="Format for logging (default: %default)")

    def __call__(self, event, obj):
        string = json.dumps(obj)
        if self.format in ["pprint", "pprint-color"]:
            string = self.pprint(obj)

        if event == 'mozmill.pass':
            self.logger.debug('Step Pass: ' + string)
        elif event == 'mozmill.fail':
            self.logger.error('Test Failure | ' + string)
        elif event == 'mozmill.frameworkFail':
            self.logger.fatal('Framework Failure | ' + string)
        elif event == 'mozmill.skip':
            self.logger.debug('Test Skipped: ' + string)
        else:
            self.logger.debug(str(event) + ' | ' + string)

    def pprint(self, obj):
        self.find_stack(obj)
        return json.dumps(obj, indent=2)

    def find_stack(self, obj):
        """Split any stacktrace string into an array."""
        if type(obj) == dict or type(obj) == list:
            iter = obj
            if type(obj) == list:
                iter = range(len(obj))

            for i in iter:
                child = obj[i]
                if i == "stack":
                    if isinstance(child, basestring):
                        # It is not very pythonic, but we need to do something
                        # completely different if our stack is a string and
                        # not an object. It's much more readable to simply
                        # have two separate functions
                        obj[i] = self.clean_stack_as_string(child)
                    else:
                        obj[i] = self.clean_stack(child)
                else:
                    self.find_stack(child)

    def clean_stack(self, caller):
        try:
            newcaller = {}

            # The name and sourceLine attributes are often None,
            # only include if they exist. There is also a language
            # attribute which we drop in favor of using
            # languageName which is more descriptive
            if caller['name']:
                newcaller['name'] = caller['name']
            if caller['sourceLine']:
                newcaller['sourceLine'] = caller['sourceLine']

            # Move the attributes we care about - note this unusual order
            # is important. This causes the output to be visually sane.
            newcaller['lineNumber'] = caller['lineNumber']
            newcaller['languageName'] = caller['languageName']
            newcaller['filename'] = caller['filename']

            if caller['caller'] is None:
                # Then we have reached the first node of the stack, roll up
                return newcaller
            newcaller['caller'] = self.clean_stack(caller['caller'])
            return newcaller
        except:
            # This is logging code, it cannot throw an exception.  If
            # something goes wrong, we just return the caller.
            return caller

    def clean_stack_as_string(self, stack):
        try:
            stacklist = [i.strip() for i in stack.split('\n')]
            if len(stacklist):
                return stacklist
            else:
                # Then we don't know what this is, just return the raw stack
                return stack
        except:
            # Something happened, just return the raw stack
            return stack

    def events(self):
        return {'mozmill.setTest': self.startTest,
                'mozmill.endTest': self.endTest,
                'mozmill.endModule': self.endModule}

    def stop(self, results, fatal):
        """Print pass/failed/skipped statistics."""

        if fatal:
            msg = 'Disconnect Error: Application unexpectedly closed'
            self.logger.log(self.custom_levels["TEST-UNEXPECTED-FAIL"], msg)

        level = self.custom_levels["RESULTS"]
        self.logger.log(level, "Passed: %d" % len(results.passes))
        self.logger.log(level, "Failed: %d" % len(results.fails))
        self.logger.log(level, "Skipped: %d" % len(results.skipped))

    ### event listeners

    def startTest(self, test):
        filename = self.mozmill.running_test.get('relpath', test['filename'])
        self.logger.log(self.custom_levels["TEST-START"],
                        "%s | %s" % (filename, test['name']))

    def endTest(self, test):
        filename = self.mozmill.running_test.get('relpath', test['filename'])
        if test.get('skipped', False):
            level = self.custom_levels['TEST-SKIPPED']
            self.logger.log(level,
                            "%s | %s" % (test['name'],
                                         test.get('skipped_reason', '')))
        elif test['failed'] > 0:
            level = "TEST-UNEXPECTED-FAIL"
            if self.mozmill.running_test.get('expected') == 'fail':
                level = "TEST-KNOWN-FAIL"
            self.logger.log(self.custom_levels[level],
                            "%s | %s" % (filename, test['name']))
        else:
            level = "TEST-PASS"
            if self.mozmill.running_test.get('expected') == 'fail':
                level = "TEST-UNEXPECTED-PASS"
            self.logger.log(self.custom_levels[level],
                            "%s | %s" % (filename, test['name']))

    def endModule(self, module):
        filename = self.mozmill.running_test.get('relpath', module['filename'])
        duration = module['time_end'] - module['time_start']
        self.logger.log(self.custom_levels["TEST-END"],
                        "%s | finished in %dms" % (filename, duration))


class ColorFormatter(logging.Formatter):
    # http://stackoverflow.com/questions/384076/
    BLACK, RED, GREEN, YELLOW, BLUE, MAGENTA, CYAN, WHITE = range(8)

    RESET_SEQ = "\033[0m"
    COLOR_SEQ = "\033[1;%dm"
    BOLD_SEQ = "\033[1m"

    COLORS = {
        'CRITICAL': YELLOW,
        'ERROR': RED,
        'WARNING': YELLOW,
        'INFO': WHITE,
        'DEBUG': BLUE,

        'TEST-UNEXPECTED-FAIL': RED,
        'TEST-UNEXPECTED-PASS': RED,
        'TEST-SKIPPED': YELLOW,
        'TEST-PASS': GREEN,
        'TEST-KNOWN-FAIL': GREEN,
        'TEST-START': BLUE,
        }

    def formatter_msg(self, msg, use_color=True):
        if use_color:
            msg = msg.replace("$RESET", self.RESET_SEQ).replace("$BOLD",
                                                                self.BOLD_SEQ)
        else:
            msg = msg.replace("$RESET", "").replace("$BOLD", "")
        return msg

    def __init__(self, format=None, use_color=True, print_stack=False, use_indent=False):
        msg = self.formatter_msg(format, use_color)
        logging.Formatter.__init__(self, msg)
        self.use_color = use_color
        self.print_stack = print_stack
        self.use_indent = use_indent

    def format(self, record):
        levelname = record.levelname
        if self.use_color and levelname in self.COLORS:
            fore_color = 30 + self.COLORS[levelname]
            levelname_color = self.COLOR_SEQ % fore_color + \
                              levelname + self.RESET_SEQ
            record.levelname = levelname_color

        if not self.print_stack:
            try:
                message = record.msg.rsplit("|", 1)
                string = message[1]
                dictionary = json.loads(string)
                dictionary = self.removeKey(dictionary, "stack")
                if self.use_indent:
                    return record.levelname + " | " + message[0] + "| " + json.dumps(dictionary, indent=2)
                return record.levelname + " | " + message[0] + "| " + json.dumps(dictionary)
            except:
                pass
        return logging.Formatter.format(self, record)

    def removeKey(self, dictionary, key):
        for (k,v) in dictionary.items():
            if k == key:
                del dictionary[k]
            if isinstance(v, dict):
                self.removeKey(v, key)
        return dictionary
