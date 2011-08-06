# Mozprofile

Mozprofile is tool for creating and managing the profiles of Mozilla's
applications (Firefox, Thunderbird). Aside from creating profiles,
mozprofile can install addons and set preferences.  It can be used
from the command line or as an API.

## Command Line Usage

mozprofile may be used to create profiles, set preferences in
profiles, or install addons into profiles.

To run mozprofile from the command line enter:
`mozprofile --help` for a list of options.


## API

To use mozprofile as an API you can import
[Profile](https://github.com/mozautomation/mozmill/tree/master/mozprofile/mozprofile/profile.py)
and/or
[AddonManager](https://github.com/mozautomation/mozmill/tree/master/mozprofile/mozprofile/addons.py). 

## Installing Addons

Addons may be installed individually or from a manifest

Example:

	from mozprofile import FirefoxProfile
	
	# create new profile to pass to mozmill/mozrunner
	profile = FirefoxProfile(addons=["adblock.xpi"])


## Setting Preferences

Preferences can be set in several ways:

- using the API: You can pass preferences in to the Profile class's
  constructor.
- using a JSON blob
- using a `.ini` file
- via command line switches: `--pref key:value --pref key:value [...]`

When setting preferences from  an `.ini` file or the `--pref` switch,
the value will be interpolated as an integer or a boolean
(`true`/`false`) if possible.

## Setting Permissions

