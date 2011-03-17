"""
pluggable event handlers for mozmill
"""

import imp
import inspect
import os

class EventHandler(object):
  """abstract base class for handling MozMill events"""

  def __init__(self):
    pass

  def __call__(self, eventName, obj):
    """handle global events"""

  def events(self):
    """returns a mapping of event types (strings) to methods"""
    return {}

  def stop(self, results, fatal):
    """handles harness shutdown (NOT a JS event)"""

  @classmethod
  def add_options(cls, parser):
    """add options to the parser"""

class HandlerMatchException:
  """
  to be raised when inappropriate arguments are passed in to a handler;
  non-fatal command-line mismatch
  """

def instantiate_handler(handler, options):
  """instantiate a handler based on a set of options"""
  try:
    argspec = inspect.getargspec(handler.__init__)
  except TypeError:
    # __init__ is actually <slot wrapper '__init__' of 'object' objects>
    # which means its not actually defined on the class
    return handler()
  args = argspec.args[1:] # don't need to pass self
  defaults = argspec.defaults or []
  offset = len(args) - len(defaults)
  mandatory = set(args[:offset])
  kw = dict([(args[i+offset], defaults[i])
             for i in range(len(defaults))])
  for arg in args:
    if hasattr(options, arg):
      kw[arg] = getattr(options, arg)

  # ensure mandatory arguments are passed
  if not mandatory.issubset(kw.keys()):
    return None

  try:
    return handler(**kw)
  except HandlerMatchException:
    return None

def load_handler(string):
  """
  load a handler given a string of the format:
  /path/to/file.py:ClassName
  """
  if ':' not in string:
    raise Exception("handler string should be of the format /path/to/file.py:ClassName")
  path, name = string.split(':', 1)
  if not os.path.exists(path):
    raise Exception("file '%s' does not exist" % path)
  module = imp.load_source(path, path)
  try:
    handler = getattr(module, name)
  except AttributeError:
    raise AttributeError("module '%s' has no attribute '%s'" % (path, name))
  return handler

def handlers():
  from pkg_resources import iter_entry_points
  handlers = []
  for i in iter_entry_points('mozmill.event_handlers'):
    try:
      handlers.append(i.load())
    except:
      raise # TODO : error handling
  return handlers
