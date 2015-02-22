#!/usr/bin/env python2

# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, you can obtain one at http://mozilla.org/MPL/2.0/.

"""
illustrate use of mozmill as an API
"""

import os
import tempfile

import mozmill

# create a test source file
# in a more practical use case `path` could point to some test.js file
test = """var test_something = function() { }"""
fd, path = tempfile.mkstemp(suffix='.js')
os.write(fd, test)
os.close(fd)

# we can use custom event handlers
# let's try the logging listener:
from mozmill.logger import LoggerListener

logger = LoggerListener()
m = mozmill.MozMill.create(
  binary='/usr/bin/firefox',
  handlers=[logger],
)

m.run([
  dict(path=path),
  dict(path=path),
])

results = m.finish()

# now there should be two passed tests
passes = 2
assert len(results.passes) == passes, \
           "Wrong number of passes. Expected: %d; You got: %d" % \
           (passes, len(results.passes))
assert len(results.alltests) == passes, \
           "Wrong number of tests. Expected: %d; You got: %d" % \
           (passes, len(results.alltests))

# remove the test
os.remove(path)
