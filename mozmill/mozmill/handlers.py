class EventHandler(object):
  """abstract base class for handling MozMill events"""

  def __init__(self):
    pass

  def __call__(self, eventName, obj):
    """handle global events"""

  def events(self):
    """returns a mapping of event types (strings) to methods"""
    return {}

  def stop(self):
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
  import inspect
  argspec = inspect.getargspec(handler.__init__)
  args = argspec.args[1:] # don't need to pass self
  defaults = argspec.defaults
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


def handlers():
  from pkg_resources import iter_entry_points
  handlers = []
  for i in iter_entry_points('mozmill.event_handlers'):
    try:
      handlers.append(i.load())
    except:
      raise # TODO : error handling
  return handlers
