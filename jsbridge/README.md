[jsbridge](https://github.com/mozautomation/mozmill/tree/master/jsbridge)
is a python-javascript bridge interface for Firefox and Mozilla
applications.

jsbridge works as an 
[extension](https://github.com/mozautomation/mozmill/tree/master/jsbridge/jsbridge/extension)
loaded into Firefox or Thunderbird
(etc.) that opens a socket, by default on port 24242, that 
is used to mirror data structures between python-land and JavaScript-land
The python component opens the same port and communication takes place.

[JSObject](https://github.com/mozautomation/mozmill/blob/master/jsbridge/jsbridge/jsobjects.py)s 
(`jsbridge.jsbobject:JSObject`) may be used to mirror
objects across between python and JavaScript.

jsbridge is utilized by 
[Mozmill](https://developer.mozilla.org/en/Mozmill) as part of its
testing infrastructure.