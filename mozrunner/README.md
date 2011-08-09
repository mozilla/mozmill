mozrunner handles running of Mozilla applications.
mozrunner utilizes [mozprofile](/en/Mozprofile)
for managing application profiles
and [mozprocess](/en/Mozprocess) for robust process control. 

mozrunner may be used from the command line or programmatically as an API.


# Command line Usage

Run `mozrunner --help` for detailed information on the command line
program.


# API Usage

mozrunner features a base class, 
[mozrunner.runner.Runner](https://github.com/mozautomation/mozmill/blob/master/mozrunner/mozrunner/runner.py) 
which is an integration layer API for interfacing with Mozilla applications.

mozrunner also exposes two application specific classes,
`FirefoxRunner` and `ThunderbirdRunner` which record the binary names
necessary for the `Runner` class to find them on the system.

Example API usage:

    from mozrunner import FirefoxRunner
	
    # start Firefox on a new profile
    runner = FirefoxRunner()
    runner.start()
