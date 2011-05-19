#!/usr/bin/env python

"""
illustrate use of mozmill as an API
"""

# you have to have some sort of test
import os
import tempfile
test = """var test_something = function() { }"""
fd, path = tempfile.mkstemp()
os.write(fd, test)
os.close(fd)

# now to do our thing: basic run
import mozmill
m = mozmill.MozMill.create()
results = m.run(dict(path=path))

# there should be one passing test
passes = 1
assert len(results.passes) == passes, "Wrong number of passes. Expected: %d; You got: %d" % (passes, len(results.passes))
assert len(results.alltests) == passes, "Wrong number of tests. Expected: %d; You got: %d" % (passes, len(results.alltests))

# this is how you use a handler
# let's try the logging handler:
from mozmill.logger import LoggerListener
logger = LoggerListener()
m = mozmill.MozMill.create(results=results, handlers=(logger,))
results = m.run(dict(path=path))
results.finish((logger,))

# now there should be two
passes *= 2
assert len(results.passes) == passes, "Wrong number of passes. Expected: %d; You got: %d" % (passes, len(results.passes))
assert len(results.alltests) == passes, "Wrong number of tests. Expected: %d; You got: %d" % (passes, len(results.alltests))

# remove the test
os.remove(path)
