import os
import sys
import urllib

import jsbridge
from jsbridge import global_settings

basedir = os.path.abspath(os.path.dirname(__file__))

global_settings.MOZILLA_PLUGINS.append(os.path.join(basedir, 'extension'))

sys.argv.append('--launch')

main = jsbridge.main
