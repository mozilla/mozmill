#!/usr/bin/env python

"""
update documentation for Mozmill
"""

import os
import sys
import urllib2
from optparse import OptionParser

# necessary imports
try:
    import markdown
except ImportError:

DEST='http://developer.mozilla.org/'
DIR=os.path.dirname(os.path.abspath(__file__))
README=['README.md', 'README.txt', 'README']

def find_readme(directory):
    """find a README file in a directory"""
    for name in README:
        path = os.path.join(directory, name)
        if os.path.exists(path):
            return path

def main(args=sys.argv[1:]):

    # parse command line options
    usage = '%prog [options]'
    parser = OptionParser(usage=usage, description=__doc__)
    parser.add_option('-d', '--directory', dest='directory',
                      help='render the documentation to this directory')
    parser.add_option('-p', '--package', dest='packages',
                      action='append',
                      help='package to operate on')
    parser.add_option('--list', dest='list', action='store_true',
                      help="list packages")
    options, args = parser.parse_args(args)

    # find packages
    packages = options.__dict__.pop('packages')
    if not packages:
        packages = [i for i in os.listdir(DIR)
                    if os.path.isdir(os.path.join(DIR, i))
                    and find_readme(os.path.join(DIR, i))]
    if options.list:
        for i in packages:
            print i

    # run setup_development.py in this directory
    # to ensure documentation is up to date
    # TODO; as yet unneeded

    # render and upload READMEs
    # TODO

if __name__ == '__main__':
    main()
