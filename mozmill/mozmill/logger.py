try:
    import json
except:
    import simplejson as json

import logging

class LoggerListener(object):

  ### methods for the EventHandler interface

  def __init__(self, showerrors=False, showall=False, logfile=None):
    self.logger = logging.getLogger('mozmill')
    log_options = { 'format': "%(levelname)s | %(message)s",
                    'level': logging.CRITICAL }
    if showerrors:
      log_options['level'] = logging.ERROR
    if logfile:
      log_options['filename'] = logfile
      log_options['filemode'] = 'w'
      log_options['level'] = logging.DEBUG
    if showall:
      log_options['level'] = logging.DEBUG    
    logging.basicConfig(**log_options)

    self.cases = {
      'mozmill.pass':   lambda string: self.logger.info('Step Pass: ' + string),
      'mozmill.fail':   lambda string: self.logger.error('Test Failure: ' + string),
      'mozmill.skip':   lambda string: self.logger.info('Test Skipped: ' + string)
      }


  @classmethod
  def add_options(cls, parser):
    parser.add_option("-l", "--logfile", dest="logfile", default=None,
                      help="Log all events to file.")
    parser.add_option("--showall", dest="showall", default=False,
                      action="store_true",
                      help="Show all test output.")
    parser.add_option("--show-errors", dest="showerrors", default=False, 
                      action="store_true",
                      help="Print logger errors to the console.")

    
  def __call__(self, eName, obj):
    if obj == {}:
      string = ''
    else:
      string = json.dumps(obj)
      
    if eName not in self.cases:
      self.cases[eName] = self.default(eName, self.logger)
    self.cases[eName](string)

  def events(self):
    return { 'mozmill.setTest': self.startTest,
             'mozmill.endTest': self.endTest }

  def stop(self, fatal):
    """print pass/failed/skipped statistics"""
    print "INFO Passed: %d" % len(self.mozmill.passes)
    print "INFO Failed: %d" % len(self.mozmill.fails)
    print "INFO Skipped: %d" % len(self.mozmill.skipped)

  ### event listeners

  def startTest(self, test):
    print "TEST-START | %s | %s" % (test['filename'], test['name'])

  def endTest(self, test):

    if test.get('skipped', False):
      print "WARNING | %s | (SKIP) %s" % (test['name'], test.get('skipped_reason', ''))

    elif test['failed'] > 0:
      print "TEST-UNEXPECTED-FAIL | %s | %s" % (test['filename'], test['name'])
    else:
      print "TEST-PASS | %s | %s" % (test['filename'], test['name'])

  ###

  def levels(self):
    """TODO : logging levels"""

  class default(object):
    # XXX no need for a separate class, I don't think
    def __init__(self, eName, logger):
      self.logger = logger
      self.eName = eName
    def __call__(self, string):
      if string:
        self.logger.debug(self.eName + ' | ' + string)
      else:
        self.logger.debug(self.eName)
    


    
