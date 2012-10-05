# Documentation for the Mozmill Repository

There are several entry points where it is desirable to have documentation available:

- the MDN project page(s) for mozmill: https://developer.mozilla.org/en/Mozmill
- the mozmill github repository: http://github.com/mozautomation/mozmill
- the python package index: http://pypi.python.org/pypi/mozmill
- in a source checkout alongside the code
- using python's `help()`
- on the AMO page: https://addons.mozilla.org/en-US/firefox/addon/9018/

This documentation should be consistent and available at
each of these places.  We should make it easy for developers to update
and add documentation as well as having accurate documentation
versioned with the repository and aspire to the principle of DRY as
much as practicable.  Documentation should be a maintainable
and high-quality resource.


## Where the Documentation Lives

Several packages exist in the [mozmill repository](http://github.com/mozautomation/mozmill):

- [mozmill](https://developer.mozilla.org/en/Mozmill) : driver,
  event-dispatcher, and test harness
- jsbridge : python to JavaScript bridge interface
- mutt : test harness for mozmill and other denizens of the Mozmill
  repo

Each of these packages contains a `README` file as well as 
possibly various other documentation files in a `docs/`
directory. These markdown files serve as the documentation canon. 


## Where the Documentation Goes

By being careful in how we organize and present information, we can
use the canonical sources in the repository to give a complete and
consistent documentation story:

- [github](https://github.com) will automation display `README.md` 
  files present in directories
- the python `setup.py` files can read the contents of the `README`
  files in their directories and they will be available when the
  package is distributed to [PyPI](http://pypi.python.org/pypi/)
- the markdown will be rendered and uploaded to
  http://developer.mozilla.org in accordance to a manifest

As of yet, it is undecided what to do about the AMO documentation.  It
is probably best to have a `mozmill/docs/extension.txt`, but until we
work out that story this will be done by hand.


## How to Update Documentation

We would love any sort of help with our documentation!  

- if at all possible, make a branch with your documentation changes
  and issue a pull request to http://github.com/mozautomation ; this
  is the most direct way to ensure that your documentation is included 

- edit the MDN documents: we will go to some effort to include edits
  in the upstream documentation.  In the future, I will probably write
  a script to help with this, but as-is, we'll just mine by hand


## How to Update Documentation on MDN

The documents for the mozmill repository are enumerated in the
`docs.manifest` file for mirroring to MDN. This `docs.manifest` file
is used by the [document-it](http://k0s.org/mozilla/hg/DocumentIt)
program to render the contents using
[Markdown](http://daringfireball.net/projects/markdown/) and upload it
to http://developer.mozilla.org/ using the API:

http://developer.mindtouch.com/en/ref/MindTouch_API/POST%3Apages%2F%2F%7Bpageid%7D%2F%2Fcontents

After you install DocumentIt, you should be able to run:

    document-it -u jhammel -p notmypassword docs.manifest 

to update the documentation on MDN.

The advantage of having this as a script is that documentation is
updated when desired so that the active version can be respected.


## Guiding Principles

- markdown should be easy to read as text.  If we want HTML documents,
  we should use HTML documents.  So ensure that the associated
  markdown documents are easy to read as text

- the canonical absolute URLs should still point to the MDN
  documentation

- contribute to documentation!  If you see something that should be
  documented, contribute it!  Don't tell someone else to do it!  We're
  all in this together.
