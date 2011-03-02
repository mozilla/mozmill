"""
logging event listener for Mozmill
"""

try:
    import json
except:
    import simplejson as json

import logging

class LoggerListener(object):

  ### methods for the EventHandler interface

  def __init__(self, showerrors=False, showall=False, logfile=None, format="json"):
    template = "%(levelname)s | %(message)s"

    self.logger = logging.getLogger('mozmill')
    formatter = logging.Formatter(template)
    if logfile:
      handler = logging.FileHandler(logfile, 'w')
      self.logger.setLevel(logging.DEBUG)
    else:
      handler = logging.StreamHandler()
      if format == "pprint-color":
        formatter = ColorFormatter(template)
    handler.setFormatter(formatter)

    if showerrors:
      self.logger.setLevel(logging.ERROR)
    if showall:
      self.logger.setLevel(logging.DEBUG)
  
    self.logger.addHandler(handler)
    self.format = format
    
    self.custom_levels = {
     "TEST-START" : 21, # logging.INFO is 20
     "TEST-PASS": 41, # logging.ERROR is 40
     "TEST-UNEXPECTED-FAIL": 42,
    }

    for name in self.custom_levels:
      logging.addLevelName(self.custom_levels[name], name)


  @classmethod
  def add_options(cls, parser):
    parser.add_option("-l", "--logfile", dest="logfile", default=None,
                      help="Log all events to file.")
    parser.add_option("--show-all", dest="showall", default=False,
                      action="store_true",
                      help="Show all test output.")
    parser.add_option("--show-errors", dest="showerrors", default=False, 
                      action="store_true",
                      help="Print logger errors to the console.")
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
      self.logger.debug(event + ' | ' + string)
      
  def pprint(self, obj):
    self.format_stack(obj)
    return json.dumps(obj, indent=2)
      
  def format_stack(self, obj):
    """ split any stacktrace string into an array """
    if type(obj) == dict or type(obj) == list:
      iter = obj
      if type(obj) == list:
        iter = range(len(obj))

      for i in iter:
        child = obj[i]
        if i == "stack":
          obj[i] = child.split("\n")
        else:
          self.format_stack(child)
      

  def events(self):
    return { 'mozmill.setTest': self.startTest,
             'mozmill.endTest': self.endTest }

  def stop(self, results, fatal):
    """print pass/failed/skipped statistics"""

    if fatal:
      self.logger.log(self.custom_levels["TEST-UNEXPECTED-FAIL"], 
        'Disconnect Error: Application unexpectedly closed')
    
    print "INFO Passed: %d" % len(results.passes)
    print "INFO Failed: %d" % len(results.fails)
    print "INFO Skipped: %d" % len(results.skipped)

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

    


    
