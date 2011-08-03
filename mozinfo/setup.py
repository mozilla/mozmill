import os
from setuptools import setup

version = '0.3.2'

# get documentation from the README
try:
    here = os.path.dirname(os.path.abspath(__file__))
    description = file(os.path.join(here, 'README.md')).read()
except IOError:
    description = ''

# dependencies
deps = []
try:
    import json
except ImportError:
    deps = ['simplejson']

setup(name='mozinfo',
      version=version,
      description="file for interface to transform introspected system information to a format pallatable to Mozilla",
      long_description=description,
      classifiers=[], # Get strings from http://pypi.python.org/pypi?%3Aaction=list_classifiers
      keywords='mozilla',
      author='Jeff Hammel',
      author_email='jhammel@mozilla.com',
      url='https://wiki.mozilla.org/Auto-tools',
      license='MPL',
      py_modules=['mozinfo'],
      packages=[],
      include_package_data=True,
      zip_safe=False,
      install_requires=deps,
      entry_points="""
      # -*- Entry points: -*-
      [console_scripts]
      mozinfo = mozinfo:main
      """,
      )
