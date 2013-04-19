#!/usr/bin/env python

# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, you can obtain one at http://mozilla.org/MPL/2.0/.

"""
illustrate use of mozmill as an API
"""

# you have to have some sort of test
import os
import tempfile

import mozmill

test = """var test_something = function() { }"""
fd, path = tempfile.mkstemp()
os.write(fd, test)
os.close(fd)

# now to do our thing: basic run
m = mozmill.MozMill.create()
m.run(dict(path=path))
results = m.finish()

# there should be one passing test
passes = 1
assert len(results.passes) == passes, \
           "Wrong number of passes. Expected: %d; You got: %d" % \
           (passes, len(results.passes))
assert len(results.alltests) == passes, \
           "Wrong number of tests. Expected: %d; You got: %d" % \
           (passes, len(results.alltests))

# this is how you use a handler
# let's try the logging handler:
from mozmill.logger import LoggerListener

logger = LoggerListener()
m = mozmill.MozMill.create(handlers=(logger,))
m.run(dict(path=path))
results = m.finish()

# now there should be two
passes *= 2
assert len(results.passes) == passes, \
           "Wrong number of passes. Expected: %d; You got: %d" % \
           (passes, len(results.passes))
assert len(results.alltests) == passes, \
           "Wrong number of tests. Expected: %d; You got: %d" % \
           (passes, len(results.alltests))

# remove the test
os.remove(path)
