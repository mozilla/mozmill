# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, you can obtain one at http://mozilla.org/MPL/2.0/.

import os
from setuptools import setup

PACKAGE_NAME = "jsbridge"
PACKAGE_VERSION = "3.0.3.1"

# package dependencies
deps = []
try:
    import json
except ImportError:
    deps.append('simplejson')

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
      classifiers=['Environment :: Console',
                   'Intended Audience :: Developers',
                   'License :: OSI Approved :: Mozilla Public License 2.0 (MPL 2.0)',
                   'Natural Language :: English',
                   'Development Status :: 4 - Beta',
                   'Operating System :: OS Independent',
                   'Programming Language :: Python',
                   'Topic :: Software Development :: Libraries :: Python Modules',
                   ],
      keywords='mozilla',
      author='Mozilla Automation and Testing Team',
      author_email='tools@lists.mozilla.org',
      url='https://github.com/mozilla/mozmill/tree/master/jsbridge',
      license='http://www.mozilla.org/MPL/2.0/',
      packages=['jsbridge'],
      include_package_data=True,
      package_data={'': ['*.js', '*.css', '*.html', '*.txt', '*.xpi',
                         '*.rdf', '*.xul', '*.jsm', '*.xml' 'extension'], },
      zip_safe=False,
      install_requires=deps,
      entry_points="",
      )
