# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, you can obtain one at http://mozilla.org/MPL/2.0/.

"""
pluggable event handlers for mozmill
"""

import imp
import inspect
import os


class EventHandler(object):
    """Abstract base class for handling MozMill events."""

    def __init__(self):
        """Constructor of the base element handler class.

        Any named arguments given will be populated from command
        line options.
        """

    def __call__(self, eventName, obj):
        """Handle global events."""

    def events(self):
        """Retrieve mapping of event typs.

        Returns a mapping of event types (strings) to methods
        e.g. return {'mozmill.endTest': self.endTestEventHandler}

        """
        return {}

    def stop(self, results, fatal):
        """Handles harness shutdown (NOT a JS event)."""

    @classmethod
    def add_options(cls, parser):
        """Add options to the parser."""


class HandlerMatchException(Exception):
    """Exception for bad handler data.

    Raised when inappropriate arguments are passed in to a handler;
    non-fatal command-line mismatch.

    """


def instantiate_handler(handler, options):
    """Instantiate a handler based on a set of options."""
    try:
        argspec = inspect.getargspec(handler.__init__)
    except TypeError:
        # __init__ is actually <slot wrapper '__init__' of 'object' objects>
        # which means its not actually defined on the class
        return handler()

    # don't need to pass self
    args = argspec.args[1:]
    defaults = argspec.defaults or []
    offset = len(args) - len(defaults)
    mandatory = set(args[:offset])
    kw = dict([(args[i + offset], defaults[i])
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
    """Load a handler given a string of the format.

    Arguments:
    string -- location of the handler, e.g. /path/to/file.py:ClassName

    """
    if ':' not in string:
        raise Exception("handler string should be of the format"
                        "/path/to/file.py:ClassName")
    path, name = string.split(':', 1)
    if not os.path.exists(path):
        raise Exception("file '%s' does not exist" % path)
    module = imp.load_source(path, path)
    try:
        handler = getattr(module, name)
    except AttributeError:
        raise AttributeError("module '%s' has no attribute '%s'" %
                             (path, name))
    return handler


def handlers():
    from pkg_resources import iter_entry_points
    handlers = []
    for i in iter_entry_points('mozmill.event_handlers'):
        try:
            handlers.append(i.load())
        except:
            # TODO : error handling
            raise
    return handlers
