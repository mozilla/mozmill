# Automation + Tools Mozmill Repository

[Mozmill](https://developer.mozilla.org/en/Mozmill) is a UI Automation
framework for Mozilla apps like Firefox and Thunderbird. It's both an
[addon](https://addons.mozilla.org/en-US/firefox/addon/9018/) and a
Python command-line tool. 

The [Mozmill repository](http://github.com/mozilla/mozmill)
contains Mozmill and supporting code which is also used for MozBase
and other [Mozilla](http://mozilla.org/) automation efforts.


## Installation

To work with the development version of Mozmill or its utilities, check out the code
from the [Github repo](http://github.com/mozilla/mozmill):

```sh
$ git clone git://github.com/mozilla/mozmill.git
$ cd mozmill
$ virtualenv venv
$ source venv/bin/activate
$ ./setup_development.py
```


## Repository Contents

The [Mozmill repository](http://github.com/mozilla/mozmill)
contains python packages for
[Mozmill](https://developer.mozilla.org/en/Mozmill)
and MozBase.

In addition, several repository support files exist for repository
documentation and management.


### Python Packages

The mozmill repository contains several Python packages:

- jsbridge : python to JavaScript bridge used by Mozmill to communicate test run information.
- mozmill : Mozilla test harness and event dispatcher
- mutt : test framework for Mozmill and related utilities

Each of these packages contains a `README.md` file in markdown syntax
giving in-depth information on their utility.  These packages all make
use of
[setuptools](http://peak.telecommunity.com/DevCenter/setuptools)
for installation.  It is highly recommended that you use 
[virtualenv](http://www.virtualenv.org/) to keep your python
environment separate from your system packages.  In this way, you can
keep multiple versions of packages around without worrying about
cross-contamination and versioning woes.


### Repository Management

In addition to the python packages, several files exist at the top
level of the repository to help keep repository management sane:

- README.md : documents what the [Mozmill repository](http://github.com/mozilla/mozmill)
  is all about; the content you're reading now

- setup_development.py : a python script that will install all python
  packages in the [Mozmill repository](http://github.com/mozilla/mozmill)
  in development mode, respecting dependency order.  This means that
  code changes will be respected the next time the python interpreter
  is invoked. Using virtualenv, checking out the 
  [git repository](http://github.com/mozilla/mozmill), and
  invoking `setup_development.py` with the virtualenv's copy of python
  is the most robust way of deploying the software

- documentation.txt : the documentation strategy for packages in the
  [Mozmill repository](http://github.com/mozilla/mozmill)

- docs.manifest : manifest of documentation for mirroring to 
  [MDN](https://developer.mozilla.org/) using the 
  [document-it](http://k0s.org/mozilla/hg/DocumentIt) script (not 
  included in the repository).  See `documentation.txt` for details

- versionbump.py : bump the version of mozmill. Use ``python versionbump.py --help`` for help

## Help and Contributing

[Mozmill](https://developer.mozilla.org/en/Mozmill) and the
[Mozmill repository](http://github.com/mozilla/mozmill) are
maintained by the Mozilla 
[Automation and Testing Team](https://wiki.mozilla.org/Auto-tools).

Please file issues on
[github](http://github.com/mozilla/mozmill),
[bugzilla](https://bugzilla.mozilla.org/enter_bug.cgi?product=Testing&component=Mozmill),
or join the `#ateam` or `#mozmill` channel on irc://irc.mozilla.org/ .
