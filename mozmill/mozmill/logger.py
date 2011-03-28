"""
logging event listener for Mozmill
"""

try:
    import json
except:
    import simplejson as json

import logging
import re
import sys

class LoggerListener(object):
  stack_regex = re.compile("(.*)@(.*?)(?: -> (file\:\/\/\/\S*))?\:(\d*)$")
  name = 'Logging'

  ### methods for the EventHandler interface
  def __init__(self, log_file=None, console_level="INFO", file_level="INFO",
               format="json", debug=False):
    template = "%(levelname)s | %(message)s"

    levels = {
      "DEBUG": logging.DEBUG,
      "INFO": logging.INFO,
      "WARNING": logging.WARNING,
      "ERROR": logging.ERROR,
      "CRITICAL": logging.CRITICAL
    }

    self.custom_levels = {
     "TEST-START" : 21, # logging.INFO is 20
     "TEST-PASS": 22,
     "TEST-UNEXPECTED-FAIL": 42,  # logging.ERROR is 40
    }
    for name in self.custom_levels:
      logging.addLevelName(self.custom_levels[name], name)

    self.logger = logging.getLogger('mozmill')
    self.logger.setLevel(logging.DEBUG)
    formatter = logging.Formatter(template)

    if console_level:
      console = logging.StreamHandler()
      if format == "pprint-color":
        formatter = ColorFormatter(template)
      console.setFormatter(formatter)
      console.setLevel(levels[console_level])
      self.logger.addHandler(console)

    if log_file:
      handler = logging.FileHandler(log_file, 'w')
      handler.setFormatter(formatter)
      handler.setLevel(levels[file_level])
      self.logger.addHandler(handler)

    sys.stdout = self.StdOutLogger(self.logger)
    sys.stderr = self.StdErrLogger(self.logger)

    self.format = format
    self.debug = debug

  class StdOutLogger:
    def __init__(self, logger):
      self.logger = logger

    def write(self, str):
      self.logger.info(str)

  class StdErrLogger:
    def __init__(self, logger):
      self.logger = logger

    def write(self, str):
      self.logger.error(str)

  @classmethod
  def add_options(cls, parser):                      
    LOG_LEVELS = ("DEBUG", "INFO", "WARNING", "ERROR", "FATAL")
    LEVEL_STRING = "[" + "|".join(LOG_LEVELS) + "]"

    parser.add_option("-l", "--log-file", dest="log_file", default=None,
                      help="Log all events to file.")
    parser.add_option("--console-level",
                    action = "store", type = "choice", dest = "console_level",
                    choices = LOG_LEVELS, metavar = LEVEL_STRING,
                    help = "level of console logging, defaulting to INFO",
                    default="INFO")
    parser.add_option("--file-level", 
                    action = "store", type = "choice", dest = "file_level",
                    choices = LOG_LEVELS, metavar = LEVEL_STRING,
                    help = "level of file logging if --log-file has been specified," + 
                      " defaulting to INFO",
                    default = "INFO")
    parser.add_option("--format", dest="format", default="json",
                      metavar="[json|pprint|pprint-color]",
                      help="Format for logging")


  def __call__(self, event, obj):
    string = json.dumps(obj)
    if self.format == "pprint" or self.format == "pprint-color":
      string = self.pprint(obj)
       
    if event == 'mozmill.pass':
      self.logger.info('Step Pass: ' + string)
    elif event == 'mozmill.fail':
      self.logger.error('Test Failure: ' + string)
    elif event == 'mozmill.skip':
      self.logger.info('Test Skipped: ' + string)
    else:
      self.logger.debug(str(event) + ' | ' + string)

  def pprint(self, obj):
    self.find_stack(obj)
    return json.dumps(obj, indent=2)

  def find_stack(self, obj):
    """ split any stacktrace string into an array """
    if type(obj) == dict or type(obj) == list:
      iter = obj
      if type(obj) == list:
        iter = range(len(obj))

      for i in iter:
        child = obj[i]
        if i == "stack":
          obj[i] = self.format_stack(child)
        else:
          self.find_stack(child)

  def format_stack(self, stack):
    stack = stack.split("\n")
    matches = [self.stack_regex.search(call) for call in stack]
    return [{'function': match.group(1),
             'filename': match.group(3) or match.group(2),
             'lineno': match.group(4)}
           for match in matches if match and (match.group(3) or self.debug)]

  def events(self):
    return { 'mozmill.setTest': self.startTest,
             'mozmill.endTest': self.endTest }

  def stop(self, results, fatal):
    """print pass/failed/skipped statistics"""

    if fatal:
      self.logger.log(self.custom_levels["TEST-UNEXPECTED-FAIL"], 
        'Disconnect Error: Application unexpectedly closed')
    
    self.logger.info("Passed: %d" % len(results.passes))
    self.logger.info("Failed: %d" % len(results.fails))
    self.logger.info("Skipped: %d" % len(results.skipped))

  ### event listeners

  def startTest(self, test):
    self.logger.log(self.custom_levels["TEST-START"], "%s | %s" % (test['filename'], test['name']))

  def endTest(self, test):
    if test.get('skipped', False):
      self.logger.warning("%s | (SKIP) %s" % (test['name'], test.get('skipped_reason', '')))
    elif test['failed'] > 0:
      self.logger.log(self.custom_levels["TEST-UNEXPECTED-FAIL"], "%s | %s" % (test['filename'], test['name']))
    else:
      self.logger.log(self.custom_levels["TEST-PASS"], "%s | %s" % (test['filename'], test['name']))


class ColorFormatter(logging.Formatter):
  # http://stackoverflow.com/questions/384076/how-can-i-make-the-python-logging-output-to-be-colored
  BLACK, RED, GREEN, YELLOW, BLUE, MAGENTA, CYAN, WHITE = range(8)

  RESET_SEQ = "\033[0m"
  COLOR_SEQ = "\033[1;%dm"
  BOLD_SEQ = "\033[1m"

  COLORS = {
    'WARNING': YELLOW,
    'INFO': WHITE,
    'DEBUG': BLUE,
    'CRITICAL': YELLOW,
    'ERROR': RED,
    'TEST-PASS': GREEN,
    'TEST-UNEXPECTED-FAIL': RED,
    'TEST-START': BLUE
  }

  def formatter_msg(self, msg, use_color = True):
    if use_color:
      msg = msg.replace("$RESET", self.RESET_SEQ).replace("$BOLD", self.BOLD_SEQ)
    else:
      msg = msg.replace("$RESET", "").replace("$BOLD", "")
    return msg

  def __init__(self, format=None, use_color=True):
    msg = self.formatter_msg(format, use_color)
    logging.Formatter.__init__(self, msg)
    self.use_color = use_color

  def format(self, record):
    levelname = record.levelname
    if self.use_color and levelname in self.COLORS:
      fore_color = 30 + self.COLORS[levelname]
      levelname_color = self.COLOR_SEQ % fore_color + levelname + self.RESET_SEQ
      record.levelname = levelname_color
    return logging.Formatter.format(self, record)

    


    
