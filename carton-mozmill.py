#!/usr/bin/env python

"""
create a mozmill carton
"""

import os
import re
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
    module =  imp.load_source(modulename, filename)
    os.remove(filename)
    return module

### requirements
carton = require('http://k0s.org/mozilla/hg/carton/raw-file/tip/carton.py')
git = which('git')
MOZMILL = 'git://github.com/mozautomation/mozmill.git'

def main(args=sys.argv[1:]):
    assert git, 'git executable not found!'

    # checkout mozmill
    tempdir = tempfile.mkdtemp()
    mozmilldir = os.path.join(tempdir, 'mozmill')
    call([git, 'clone', MOZMILL, mozmilldir])
    call([git, 'fetch'], cwd=mozmilldir)
    call([git, 'branch', 'hotfix-2.0', 'origin/hotfix-2.0'], cwd=mozmilldir)
    call([git, 'checkout', 'hotfix-2.0'], cwd=mozmilldir)

    # get the mozmill version
    setup_py = os.path.join(mozmilldir, 'mozmill', 'setup.py')
    assert os.path.exists(setup_py)
    regex = re.compile(r"""PACKAGE_VERSION *= *['"]([^'"]+)['"].*""")
    for line in file(setup_py).readlines():
        line = line.strip()
        match = regex.match(line)
        if match:
           version = match.groups(0)
           break
    else:
        shutil.rmtree(tempdir)
        raise Exception("Mozmill version not found!")

    # create the carton
    carton.main(['mozmill-%s' % version, mozmilldir, '--python-script', 'src/mozmill/setup_development.py'])

    # remove vestiges
    shutil.rmtree(tempdir)


if __name__ == '__main__':
    main()
    
