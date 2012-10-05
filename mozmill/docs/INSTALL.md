[Mozmill](https://developer.mozilla.org/en/Mozmill) 
can be installed as an extension or from the python source.


# Installing the Extension

The Mozmill extension can be installed from 
[its home on addons.mozilla.org](https://addons.mozilla.org/en-US/firefox/addon/9018).
Or open the "Get Add-ons" tab of the Add-ons Manager and search for
"Mozmill".


# Installing the Python Package

If you have [python](http://python.org) on your computer you will be
able to install and utilize the Mozmill python package.

Depending on your needs, you may want to install Mozmill from its
[Python Package Index page](http://pypi.python.org/pypi/mozmill) or
its [github repository](https://github.com/mozautomation/mozmill). In
either case, you will need 
[setuptools](http://peak.telecommunity.com/DevCenter/setuptools) and
it is highly recommended that you use 
[virtualenv](http://www.virtualenv.org/) to keep your Mozmill python
environment separate from your system packages.


## Using virtualenv

[virtualenv](http://www.virtualenv.org/) is a tool to create isolated
Python environments. If you have `pip` or `easy_install` on your
system, you can run `pip install virtualenv` or `easy_install
virtualenv` to install it, or download and install from the source on
[pypi](http://pypi.python.org/pypi/virtualenv) or the
[github repository](https://github.com/pypa/virtualenv).

Once you have virtualenv installed, you can make an environment for 
Mozmill, e.g.:

    virtualenv mozmill

Run the activate script for your platform.  For e.g. linux:

    cd mozmill
    . bin/activate

It is recommended that you make a `src` directory for Mozmill and
other packages you are interested in developing:

    mkdir src
    cd src


## Installing from github

The prefered installation method is from the 
[github mozautomation/mozmill repository](https://github.com/mozautomation/mozmill/). 
Clone the repository (into your virtualenv's src directory) 
using [git](http://git-scm.com/) and run the
[setup_development.py](https://github.com/mozautomation/mozmill/blob/master/setup_development.py)
script in the activated virtualenv which will install the packages in the correct order:

    git clone git://github.com/mozautomation/mozmill.git
    cd mozmill
    python setup_development.py

The modules will be installed in development mode, which means that
editing the code will directly change module behaviour.

In order to update, go to the checkout directory and run:

    git pull

You may need to run `setup_development.py` again if any of the
`setup.py` files are changed.

These instructions will give you a basic git checkout of the canonical
(mozautomation's) master branch.  If you are interested in 
[developing Mozmill](https://wiki.mozilla.org/Auto-tools/Projects/Mozmill)
or related software, see more detailed instructions about
[how to set up your repo](https://wiki.mozilla.org/Auto-tools/Projects/Mozmill/RepoSetup).


## Installing from PyPI

If you have `easy_install` or `pip` (both of which come packaged with
virtualenv), you can install mozmill and its dependencies with a
single command:

    easy_install mozmill

or:

    pip install mozmill

This will install the latest version from
[pypi](http://pypi.python.org/pypi/mozmill).

If you don't have
[easy_install](http://pypi.python.org/pypi/setuptools), you can get it
by downloading and running
http://peak.telecommunity.com/dist/ez_setup.py . For example:

    curl -O http://peak.telecommunity.com/dist/ez_setup.py
    python ez_setup.py

Note again, that `easy_install` and the rest of setuptools comes with
virtualenv, so if you use virtualenv you won't have this amongst many
other problems.

You can upgrade a package (e.g. mozmill) by using `easy_install -u $PACKAGE` or 
`pip install --upgrade $PACKAGE`.
