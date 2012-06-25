# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this file,
# You can obtain one at http://mozilla.org/MPL/2.0/.


def init_jsobject(cls, bridge, name, value, description=None):
    """Initialize a JS object that is a subclassed base type.

    Arguments:
    cls -- Class the object has to be created from
    bridge -- JSBridge instance to use
    name -- Name of the JS object
    value -- Value of the object wrapped as JS object

    Keyword arguments:
    description -- Additional information about the object

    """
    obj = cls(value)
    obj._bridge_ = bridge
    obj._name_ = name
    obj._description_ = description
    return obj


def create_jsobject(bridge, fullname, value=None, obj_type=None,
                    override_set=False):
    """Create a single JSObject for named object on other side of the bridge.

    This is a factory method which assists in creating a JS object by handling
    various initialization cases for different JSObjects.

    Arguments:
    bridge -- JSBridge instance to use
    fullname -- Full name of the object

    Keyword arguments:
    value -- Value of the object wrapped as JS object
    obj_type -- Type of the JS object to create from
    override_set -- Override the name of the object

    """
    description = bridge.describe(fullname)
    obj_type = description['type']
    value = description.get('data', None)

    if value is True or value is False:
        return value

    if obj_type in js_type_cases:
        cls, needs_init = js_type_cases[obj_type]
        # Objects that requires initialization are base types
        # that have "values".
        if needs_init:
            obj = init_jsobject(cls, bridge, fullname, value,
                                description=description)
        else:
            obj = cls(bridge, fullname, description=description,
                      override_set=override_set)
        return obj
    else:
        # Something very bad happened, we don't have a representation
        # for the given type.
        raise TypeError("No JSObject for javascript type '%s'" % obj_type)


class JSObject(object):
    """Base javascript object representation."""
    _loaded_ = False

    def __init__(self, bridge, name, override_set=False,
                 description=None, *args, **kwargs):
        self._bridge_ = bridge
        if not override_set:
            name = bridge.set(name)['data']
        self._name_ = name
        self._description_ = description

    def __jsget__(self, name):
        """Abstraction for final step in get events __getitem__/__getattr__."""
        result = create_jsobject(self._bridge_, name, override_set=True)
        return result

    def __attributes__(self):
        """Returns the attributes in the object."""
        return self._bridge_.describe(self._name_)['attributes']

    def __iter__(self):
        for i in self.__attributes__():
            yield getattr(self, i)

    def __getattr__(self, name):
        """Get the object from jsbridge.

        Handles lazy loading of all attributes of self.

        """
        if name == '_getAttributeNames':
            # A little hack so that ipython returns all the names.
            return self.__attributes__

        if name in self.__attributes__():
            return self.__jsget__(self._name_ + '["' + name + '"]')
        else:
            raise AttributeError(name + " is undefined.")

    __getitem__ = __getattr__

    def __setattr__(self, name, value):
        """Set the given JSObject as an attribute of this JSObject.

        Beside setting the attribute it also makes proper javascript
        assignments on the other side of the bridge.

        """
        if name.startswith('_') and name.endswith('_'):
            return object.__setattr__(self, name, value)

        response = self._bridge_.setAttribute(self._name_, name, value)
        object.__setattr__(self, name, create_jsobject(self._bridge_,
                                                       response['data'],
                                                       override_set=True))

    __setitem__ = __setattr__


class JSFunction(JSObject):
    """Javascript function represenation.

    Returns a JSObject instance for the serialized js type with
    name set to the full javascript call for this function.

    """
    def __init__(self, bridge, name, override_set=False,
                 description=None, *args, **kwargs):
        self._bridge_ = bridge
        self._name_ = name
        self._description_ = description

    def __call__(self, *args):
        response = self._bridge_.execFunction(self._name_, args)
        if response['data'] is not None:
            return create_jsobject(self._bridge_, response['data'],
                                   override_set=True)


class JSString(JSObject, unicode):
    "Javascript string representation."
    __init__ = unicode.__init__


class JSInt(JSObject, int):
    """Javascript number representation for Python int."""
    __init__ = int.__init__


class JSFloat(JSObject, float):
    """Javascript number representation for Python float."""
    __init__ = float.__init__


class JSUndefined(JSObject):
    """Javascript undefined representation."""
    __str__ = lambda self: "undefined"

    def __cmp__(self, other):
        if isinstance(other, JSUndefined):
            return True
        else:
            return False

    __nonzero__ = lambda self: False

js_type_cases = {'function': (JSFunction, False,),
                 'object': (JSObject, False,),
                 'array': (JSObject, False,),
                 'string': (JSString, True,),
                 'number': (JSFloat, True,),
                 'undefined': (JSUndefined, False,),
                 'null': (JSObject, False,),
                 }
py_type_cases = {unicode: JSString,
                 str: JSString,
                 int: JSInt,
                 float: JSFloat,
                 }
