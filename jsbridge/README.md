# jsbridge

python to javascript bridge interface for Firefox and Mozilla
applications

### How it works

jsbridge works as an extension loaded into Firefox or Thunderbird
(etc.) that opens a socket, by default on port 24242, that 
may be used to mirror data structures between python-land and JavaScript-land
The python component opens the same port and communication takes place.

`JSObject`s (`jsbridge.jsbobject:JSObject`) may be used to mirror
objects across the between python and JavaScript.