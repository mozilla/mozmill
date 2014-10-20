# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, you can obtain one at http://mozilla.org/MPL/2.0/.

import os
import sys
from setuptools import setup, find_packages

PACKAGE_NAME = "mutt"
PACKAGE_VERSION = "0.1"

deps = ['manifestparser == 0.6',
        'mozfile == 1.1',
        'mozmill']

desc = "Test Harness for Mozmill"
license = 'License :: OSI Approved :: Mozilla Public License 2.0 (MPL 2.0)',
topic = 'Topic :: Software Development :: Libraries :: Python Modules'

# we only support python 2 right now
assert sys.version_info[0] == 2

# take description from README
here = os.path.dirname(os.path.abspath(__file__))
try:
    description = file(os.path.join(here, 'README.md')).read()
except (OSError, IOError):
    description = ''

setup(name=PACKAGE_NAME,
      version=PACKAGE_VERSION,
      description=desc,
      long_description=description,
      author='Mozilla Automation and Testing Team',
      author_email='tools@lists.mozilla.org',
      url='http://github.com/mozilla/mozmill',
      license='http://www.mozilla.org/MPL/2.0/',
      packages=find_packages(exclude=['legacy']),
      zip_safe=False,
      entry_points="""
          [console_scripts]
          mutt = mutt:run
        """,
      platforms=['Any'],
      install_requires=deps,
      classifiers=[license, topic,
                   'Development Status :: 4 - Beta',
                   'Environment :: Console',
                   'Intended Audience :: Developers',
                   'Operating System :: OS Independent',
                  ]
     )
