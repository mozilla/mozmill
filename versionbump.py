#!/usr/bin/env python

"""
bump mozmill versions

Example::

  versionbump.py mozmill=2.0b2 jsbridge=3.0b2

see https://bugzilla.mozilla.org/show_bug.cgi?id=667320
"""

import optparse
import os
import pkg_resources
import re
import shutil
import sys
import tempfile

from subprocess import PIPE
try:
    from subprocess import check_call as call
except ImportError:
    from subprocess import call


def which(fileName, path=os.environ['PATH']):
    """python equivalent of which; should really be in the stdlib"""
    dirs = path.split(os.pathsep)
    for dir in dirs:
        if os.path.isfile(os.path.join(dir, fileName)):
            return os.path.join(dir, fileName)

git = which('git')
assert git, "git not found"
packages = ['jsbridge', 'mozmill']


def package_info(directory):
    """get the package info from a particular directory"""

    # setup the egg info crap
    call([sys.executable, 'setup.py', 'egg_info'], cwd=directory, stdout=PIPE)

    # get the .egg-info directory
    egg_info = [i for i in os.listdir(directory)
                if i.endswith('.egg-info')]
    assert len(egg_info) == 1, \
               'Expected one .egg-info directory in %s, got: %s' % \
               (directory, egg_info)
    egg_info = os.path.join(directory, egg_info[0])
    assert os.path.isdir(egg_info), "%s is not a directory" % egg_info

    # read the dependencies
    requires = os.path.join(egg_info, 'requires.txt')
    if os.path.exists(requires):
        dependencies = [i.strip()
                        for i in file(requires).readlines()
                            if i.strip()]
    else:
        dependencies = []

    # read the package information
    pkg_info = os.path.join(egg_info, 'PKG-INFO')
    info_dict = {}
    for line in file(pkg_info).readlines():
        if not line or line[0].isspace():
            # XXX neglects description
            continue
        assert ':' in line
        key, value = [i.strip() for i in line.split(':', 1)]
        info_dict[key] = value

    # ensure we have the damn version
    assert 'Version' in info_dict, "%s doesnt have a version" % directory

    # return the information
    info_dict['Dependencies'] = dependencies
    return info_dict


def main(args=sys.argv[1:]):

    # parse command line options
    parser = optparse.OptionParser()
    parser.add_option('--info', dest='info',
                      action='store_true', default=False,
                      help="display package information and exit")
    parser.add_option('--url', dest='url',
                      default='git://github.com/mozilla/mozmill.git',
                      help='git url of the repo')
    parser.add_option('-d', '--directory', dest='directory',
                      help="local directory to use")
    parser.add_option('--cleanup', dest='cleanup',
                      action='store_true', default=False,
                      help='cleanup the temporary directory')
    parser.add_option('-o', '--output', dest='output',
                      help="place to output the diff to")
    options, _packages = parser.parse_args(args)

    try:

        # clone the mozmill repo
        if options.directory:
            directory = options.directory
        else:
            directory = tempfile.mkdtemp()
            call([git, 'clone', options.url, directory],
                 stdout=PIPE, stderr=PIPE)

        # get the package information
        info = {}
        for package in packages:
            info[package] = package_info(os.path.join(directory, package))

        if options.info:
            # print package information
            for package in packages:
                print "%s %s" % (package, info[package]['Version'])
                if info[package]['Dependencies']:
                    for dep in info[package]['Dependencies']:
                        print ' - %s' % dep
                print
        else:

            if not _packages:
                parser.print_help()
                parser.exit()

            # figure out the desired versions
            versions = {}
            for package in _packages:
                try:
                    package, version = package.split('=')
                    # sanity check
                    pkg_resources.parse_version(version)
                    versions[package] = version
                except:
                    raise Exception("Bad package string: %s" % package)
            assert set(versions.keys()).issubset(packages)

            # figure out what to bump dependencies to
            to_bump = {}
            for package in info:
                for dep in info[package]['Dependencies']:
                    split = dep.split()
                    if len(split) == 3 and split[0] in versions:
                        # XXX hack
                        assert split[1] == '=='
                        to_bump.setdefault(package,
                                           {})[split[0]] = (split[2],
                                                            versions[split[0]])

            # bump the versions
            for package in versions:
                setup_py = os.path.join(directory, package, 'setup.py')
                assert os.path.exists(setup_py)

                lines = file(setup_py).readlines()
                regex = r"""PACKAGE_VERSION *= *["']%s['"].*""" % \
                            re.escape(info[package]['Version'])
                for index, line in enumerate(lines):
                    if re.match(regex, line):
                        lines[index] = 'PACKAGE_VERSION = "%s"\n' % \
                                           versions[package]
                        break
                f = file(setup_py, 'w')
                for line in lines:
                    f.write(line)
                f.close()

            # bump the dependencies versions
            for package in to_bump:
                setup_py = os.path.join(directory, package, 'setup.py')
                content = file(setup_py).read()
                for dep, \
                    (from_version, to_version) in to_bump[package].items():
                    content, _ = re.subn('%s *== *%s' %
                                             (dep, re.escape(from_version)),
                                         '%s == %s' % (dep, to_version),
                                         content)
                f = file(setup_py, 'w')
                f.write(content)
                f.close()

            # bump the extension versions for jsbridge and mozmill
            for package in ['jsbridge', 'mozmill']:
                if package not in versions:
                    continue
                install_rdf = os.path.join(directory, package, package,
                                           'extension', 'install.rdf')
                content = file(install_rdf).read()
                from_version = '<em:version>%s</em:version>' % \
                                   info[package]['Version']
                assert from_version in content, '%s not in %s' % \
                                                    (from_version, install_rdf)
                content = content.replace(from_version,
                                          '<em:version>%s</em:version>' %
                                              versions[package])
                f = file(install_rdf, 'w')
                f.write(content)
                f.close()

            # print the diff
            if options.output:
                call('%s diff > %s' % (git, options.output),
                     cwd=directory, shell=True)
            else:
                call([git, 'diff'], cwd=directory)
    finally:
        # cleanup
        if options.cleanup:
            if not options.directory:
                shutil.rmtree(directory)
        else:
            print directory


if __name__ == '__main__':
    main()
