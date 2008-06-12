This package accompanies the article at MozillaZine Knowledge Base, which can be
found at <http://kb.mozillazine.org/Getting_started_with_extension_development>

You can use its contents as a starting point for developing extensions. Steps to
register these files in the EM are described in the "Registering your extension 
in the Extension Manager" section of the article. In short:
 1. Unzip this package to any location, e.g. c:\dev
 2. Put the path to the "mozmill" folder (e.g. c:\dev\mozmill) in the 
    "mozmill@mozilla.doslash.org" file and move that file to 
    [profile folder]\extensions\
 3. Restart Firefox.

You should see a new red "Hello world" item in the Tools menu and the extension
should show up in the Extension Manager window (Tools > Extensions).

********* YOU MUST RUN FIREFOX 1.5RC OR LATER TO USE THIS PACKAGE **************

A bash build script (build.sh) is included for building the XPI on
Cygwin, Linux, and maybe Mac OS X. It's currently tested only on Cygwin.

The most recent version of the build script is available at
 <http://kb.mozillazine.org/Bash_build_script>

For details on packaging see <http://kb.mozillazine.org/Packaging_extensions>.

There are also other scripts, including Windows cmd build script using 7-Zip,
WinRAR or similar software, and a perl build script.

mozmill.xpi contains working prebuilt version of the extension, just in case.

********************************************************************************

You must change the following items before making your extension 
available to general public:
1) the extension's ID in install.rdf (mozmill@mozilla.doslash.org).
  (For details see <http://kb.mozillazine.org/Install.rdf>)
2) the extension's short name (currently "mozmill"). 
  The new name must be in lower case.




If you have any problems that you can't solve yourself, post in the forums 
 <http://forums.mozillazine.org/viewforum.php?f=19>
