# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, you can obtain one at http://mozilla.org/MPL/2.0/.


class JavaScriptError(Exception):
    """Error raised when a Javascript error occurs"""
    pass


class ConnectionError(Exception):
    """Error raised when a connection cannot be established"""
    pass
