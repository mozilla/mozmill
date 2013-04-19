#!/usr/bin/env python

# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, you can obtain one at http://mozilla.org/MPL/2.0/.

"""
create a mozmill carton
"""

import optparse
import os
import shutil
import sys
import tempfile

try:
    from subprocess import check_call as call
except ImportError:
    from subprocess import call

### stuff that should be in the stdlib


def which(fileName, path=os.environ['PATH']):
    """python equivalent of which; should really be in the stdlib"""
    dirs = path.split(os.pathsep)
    for dir in dirs:
        if os.path.isfile(os.path.join(dir, fileName)):
            return os.path.join(dir, fileName)


def require(url):
    """
    import a module from the web
    url should be like scheme://host.name/path/to/module.py
    """
    import imp
    import urllib2
    contents = urllib2.urlopen(url).read()
    filename = url.rsplit('/', 1)[-1]
    modulename = filename.rsplit('.', 1)[-1]
    fd, filename = tempfile.mkstemp(suffix='.py', prefix=modulename)
    os.write(fd, contents)
    os.close(fd)
    module = imp.load_source(modulename, filename)
    os.remove(filename)
    return module

### requirements
carton = require('http://k0s.org/mozilla/hg/carton/raw-file/tip/carton.py')
git = which('git')
MOZBASE = 'git://github.com/mozilla/mozbase.git'
MOZMILL = 'git://github.com/mozilla/mozmill.git'


def main(args=sys.argv[1:]):
    assert git, 'git executable not found!'

    # parse command line options
    parser = optparse.OptionParser()
    parser.add_option('--name', dest='name', default='mozmill-env',
                      help='name of the environment')
    options, args = parser.parse_args(args)

    # checkout mozbase
    tempdir = tempfile.mkdtemp()
    mozbasedir = os.path.join(tempdir, 'mozbase')
    call([git, 'clone', MOZBASE, mozbasedir])

    # checkout mozmill
    mozmilldir = os.path.join(tempdir, 'mozmill')
    call([git, 'clone', MOZMILL, mozmilldir])

    # make a carton
    carton.main([options.name, mozmilldir, mozbasedir,
                 '--python-script', 'src/mozbase/setup_development.py',
                 '--python-script', 'src/mozmill/setup_development.py',
                 ])

    # remove vestiges
    shutil.rmtree(tempdir)


if __name__ == '__main__':
    main()
