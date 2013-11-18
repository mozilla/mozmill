# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, you can obtain one at http://mozilla.org/MPL/2.0/.

import os
from setuptools import setup, find_packages

PACKAGE_NAME = "mozmill"
PACKAGE_VERSION = "2.0.1"

deps = ['jsbridge == 3.0',
        'mozrunner == 5.27',
        ]

# take description from README
here = os.path.dirname(os.path.abspath(__file__))
try:
    description = file(os.path.join(here, 'README.md')).read()
except (OSError, IOError):
    description = ''

setup(name=PACKAGE_NAME,
      version=PACKAGE_VERSION,
      description="UI Automation tool for Mozilla applications",
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
      url='http://github.com/mozilla/mozmill',
      license='http://www.mozilla.org/MPL/2.0/',
      packages=['mozmill'],
      include_package_data=True,
      package_data={'': ['*.js', '*.css', '*.html', '*.txt', '*.xpi', '*.rdf',
                         '*.xul', '*.jsm', '*.xml'], },
      zip_safe=False,
      install_requires=deps,
      entry_points="""
          [console_scripts]
          mozmill = mozmill:cli

          [mozmill.event_handlers]
          logging = mozmill.logger:LoggerListener
          report = mozmill.report:Report
          callbacks = mozmill.python_callbacks:PythonCallbacks
        """
)
