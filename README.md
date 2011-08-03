# Mozmill

[Mozmill](https://developer.mozilla.org/en/Mozmill) is a UI Automation
framework for Mozilla apps like Firefox and Thunderbird. It's both an
[addon](https://addons.mozilla.org/en-US/firefox/addon/9018/) and a
Python command-line tool. The addon provides an IDE for writing and
running the JavaScript tests and the Python package provides a
mechanism for running the tests from the command line as well as
providing a way to test restarting the application. 

## Installation

Install the command-line client via either setuptools or pip
([detailed instructions](https://developer.mozilla.org/en/Mozmill#The_Command_Line_Client)): 

    pip install mozmill
	
To work with the development version of Mozmill, check out the code
from the [Github repo](http://github.com/mozautomation/mozmill):

    git clone http://github.com/mozautomation/mozmill.git
    cd mozmill
    ./setup_development.py

	
## Usage

After installing the Python package you can run Mozmill with the `mozmill` command:

    mozmill -t ~/tests/testBookmarks.js

More information about running the harness is available via `mozmill --help` and 
in-depth documentation is here: https://developer.mozilla.org/en/Mozmill


## Python Packages

Mozmill uses several Python packages:

### mozprofile

Creates and manages user profiles for Mozilla apps:

	from mozprofile import FirefoxProfile
	
	# create new profile to pass to mozmill/mozrunner
	profile = FirefoxProfile(addons=["adblock.xpi"])
	
### mozrunner

Handles start/stop automation of Mozilla applications:

    from mozrunner import FirefoxRunner
	
    # start Firefox on a new profile
    runner = FirefoxRunner()
    runner.start()
	
### mozprocess

Generic cross-platform  process management.

### jsbridge

Python to JavaScript bridge used by Mozmill to communicate test run information.

### mozinfo

Gathers system information
