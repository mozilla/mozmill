# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this file,
# You can obtain one at http://mozilla.org/MPL/2.0/.

import os
import sys
from setuptools import setup, find_packages

PACKAGE_NAME = "jsbridge"
PACKAGE_VERSION = "3.0rc1"

# package dependencies
requires = []
try:
    import json
except ImportError:
    requires.append('simplejson')

# take description from README
here = os.path.dirname(os.path.abspath(__file__))
try:
    description = file(os.path.join(here, 'README.md')).read()
except (OSError, IOError):
    description = ''

setup(name=PACKAGE_NAME,
      version=PACKAGE_VERSION,
      description="Python to JavaScript bridge interface",
      long_description=description,
      author='Mikeal Rogers, Mozilla',
      author_email='mikeal.rogers@gmail.com',
      url='http://github.com/mozautomation/mozmill',
      license='http://www.mozilla.org/MPL/2.0/',
      packages=find_packages(exclude=['test']),
      include_package_data=True,
      package_data = {'': ['*.js', '*.css', '*.html', '*.txt', '*.xpi', '*.rdf', '*.xul', '*.jsm', '*.xml' 'extension'],},
      zip_safe=False,
      entry_points="",
      platforms =['Any'],
      install_requires = requires,
      classifiers=['Development Status :: 4 - Beta',
                   'Environment :: Console',
                   'Intended Audience :: Developers',
                   'License :: OSI Approved :: Mozilla Public License 2.0 (MPL 2.0)',
                   'Operating System :: OS Independent',
                   'Topic :: Software Development :: Libraries :: Python Modules',
                  ]
     )
