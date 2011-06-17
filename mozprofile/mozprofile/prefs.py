#!/usr/bin/env python

"""
user preferences
"""

import os
from ConfigParser import SafeConfigParser as ConfigParser

try:
    import json
except ImportError:
    import simplejson as json

class PreferencesReadError(Exception):
    """read error for prefrences files"""


class Preferences(object):
    def __init__(self, prefs=None):
        self._prefs = []
        if prefs:
            self.add(prefs)

    def add(self, prefs, cast=False):
        """
        - cast: whether to cast strings to value, e.g. '1' -> 1
        """
        # wants a list of 2-tuples
        if isinstance(prefs, dict):
            prefs = prefs.items()
        if cast:
            prefs = [(i, self.cast(j)) for i, j in prefs]
        self._prefs += prefs

    def add_file(self, path):
        """a preferences from a file"""
        self.add(self.read(path))

    def __call__(self):
        return dict(self._prefs)

    @classmethod
    def cast(cls, value):
        """
        interpolate a preference from a string
        from the command line or from e.g. an .ini file, there is no good way to denote
        what type the preference value is, as natively it is a string
        - integers will get cast to integers
        - true/false will get cast to True/False
        - anything enclosed in single quotes will be treated as a string with the ''s removed from both sides
        """

        quote = "'"
        if value == 'true':
            return  True
        if value == 'false':
            return False
        try:
            return int(value)
        except ValueError:
            pass
        if value.startswith(quote) and value.endswith(quote):
            value = value[1:-1]
        return value


    @classmethod
    def read(cls, path):
        """read preferences from a file"""

        section = None # for .ini files
        basename = os.path.basename(path) 
        if ':' in basename:
            # section of INI file
            path, section = path.rsplit(':', 1)

        if not os.path.exists(path):
            raise PreferencesReadError("'%s' does not exist" % path)

        if section:
            try:
                return cls.read_ini(path, section)
            except PreferencesReadError:
                raise
            except Exception, e:
                raise PreferencesReadError(str(e))

        # try both JSON and .ini format
        try:
            return cls.read_json(path)
        except Exception, e:
            try:
                return cls.read_ini(path)
            except Exception, f:
                for exception in e, f:
                    if isinstance(exception, PreferencesReadError):
                        raise exception
                raise PreferencesReadError("Could not recognize format of %s" % path)
                

    @classmethod
    def read_ini(cls, path, section=None):
        parser = ConfigParser()
        parser.read(path)

        if section:
            if section not in parser.sections():
                raise PreferencesReadError("No section '%s' in %s" % (section, path))
            retval = parser.items(section, raw=True)
        else:
            retval = parser.defaults().items()

        # cast the preferences since .ini is just strings
        return [(i, cls.cast(j)) for i, j in retval]

    @classmethod
    def read_json(cls, path):
        prefs = json.loads(file(path).read())

        if type(prefs) not in [list, dict]:
            raise PreferencesReadError("Malformed preferences: %s" % path)
        if isinstance(prefs, list):
            if [i for i in prefs if type(i) != list or len(i) != 2]:
                raise PreferencesReadError("Malformed preferences: %s" % path)
            values = [i[1] for i in prefs]
        elif isinstance(prefs, dict):
            values = prefs.values()
        else:
            raise PreferencesReadError("Malformed preferences: %s" % path)
        types = (bool, basestring, int)
        if [i for i in values
            if not [isinstance(i, j) for j in types]]:
            raise PreferencesReadError("Only bool, string, and int values allowed")
        return prefs

if __name__ == '__main__':
    pass
