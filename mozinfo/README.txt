MozInfo
=======

Throughout mozmill and other mozilla python code, checks for various
platforms are done in many different ways.  The various checks needed
lead to a lot of copy+pasting, leaving the reader to wonder....is this
specific check necessary for (e.g.) an operating system?  Because
information is not consolidated, checks are not done consistently, nor
is it defined what we are checking for.

MozInfo proposes to solve this problem.  The current [beta]
implementation gives five key, values: os, hostname, version, bits,
and processor. (Additionally, the service pack is available on
windows, though probably only for legacy reasons.)


API Usage
---------

MozInfo is a python package.  Downloading the software and running
``python setup.py develop`` will allow you to do ``import mozinfo``
from python.  mozinfo.py is the only file contained is this package,
so if you need a single-file solution, you can just download or call
this file through the web.

The top level attributes (os, version, bits, processor, hostname) are
available as module globals::

 if mozinfo.os == 'win': ...

In addition, mozinfo exports a dictionary, ``mozinfo.info``, that
contain these values.  mozinfo also exports:

 - choices: a dictionary of possible values for os, bits, and
   processor
 - main: the console_script entry point for mozinfo
 - unknown: a singleton denoting a value that cannot be determined

unknown has the string representation "UNKNOWN". unknown will evaluate
as False when used as a bool in python::

 if not mozinfo.os: ... # unknown!


Command Line Usage
------------------

MozInfo comes with a command line, ``mozinfo`` which may be used to
diagnose one's current system.

Example output::

 os: linux
 hostname: jhammel-THINK
 version: Ubuntu 10.10
 bits: 32
 processor: x86

Three of these fields, os, bits, and processor, have a finite set of
choices.  You may display the value of these choices using 
``mozinfo --os``, ``mozinfo --bits``, and ``mozinfo --processor``. 
``mozinfo --help`` documents command-line usage.
