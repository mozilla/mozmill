# mozrunner

Handles runing of Mozilla applications.

mozrunner utilizes mozprofile for managing application profiles
and mozprocess for robust process control. 

mozrunner may be used from the command line as an API


## Command line Usage

Run `mozrunner --help` for detailed information on the command line
program.


## API Usage

Example API usage:

    from mozrunner import FirefoxRunner
	
    # start Firefox on a new profile
    runner = FirefoxRunner()
    runner.start()
