/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

var EXPORTED_SYMBOLS = ["Server", "AsyncRead", "Session", "sessions", "startServer"];

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

var bridge = {}; Cu.import("resource://jsbridge/modules/bridge.js", bridge);
var gJsbridgeFileLogger = {}; Cu.import("resource://jsbridge/modules/jsbridgefilelogger.js", gJsbridgeFileLogger);

const DEBUG_ON = true;
const DO_FILE_LOGGING = true;
const BUFFER_SIZE = 1024;

var hwindow = Cc["@mozilla.org/appshell/appShellService;1"].
              getService(Ci.nsIAppShellService).hiddenDOMWindow;

var uuidgen = Cc["@mozilla.org/uuid-generator;1"].getService(Ci.nsIUUIDGenerator);

function AsyncRead(session) {
  this.session = session;
}

AsyncRead.prototype.onStartRequest = function (request, context) {
};

AsyncRead.prototype.onStopRequest = function (request, context, status) {
  this.session.onQuit();
};

AsyncRead.prototype.onDataAvailable = function (request, context, inputStream, offset, count) {
  var str = {};
  str.value = '';

  var bytesAvail = 0;
  do {
    bytesAvail = (count > BUFFER_SIZE) ? BUFFER_SIZE : count;

    var parts = {};
    var bytesRead = this.session.instream.readString(bytesAvail, parts);
    count = count - bytesRead;
    str.value += parts.value;
  } while (count > 0);

  this.session.receive(str.value);
};

backstage = this;

function Session(transport) {
  this.transpart = transport;
  this.sandbox = Cu.Sandbox(backstage);
  this.sandbox.bridge = new bridge.Bridge(this);
  this.sandbox.openPreferences = hwindow.openPreferences;

  try {
    this.outputstream = transport.openOutputStream(Ci.nsITransport.OPEN_BLOCKING, 0, 0);
    this.outstream = Cc['@mozilla.org/intl/converter-output-stream;1'].
                     createInstance(Ci.nsIConverterOutputStream);
    this.outstream.init(this.outputstream, 'UTF-8', BUFFER_SIZE,
                        Ci.nsIConverterInputStream.DEFAULT_REPLACEMENT_CHARACTER);
    this.stream = transport.openInputStream(0, 0, 0);
    this.instream = Cc['@mozilla.org/intl/converter-input-stream;1'].
                    createInstance(Ci.nsIConverterInputStream);
    this.instream.init(this.stream, 'UTF-8', BUFFER_SIZE,
                       Ci.nsIConverterInputStream.DEFAULT_REPLACEMENT_CHARACTER);
  } catch (e) {
    log('jsbridge: Error: ' + e);
  }

  this.pump = Cc['@mozilla.org/network/input-stream-pump;1'].
              createInstance(Ci.nsIInputStreamPump);
  this.pump.init(this.stream, -1, -1, 0, 0, false);
  this.pump.asyncRead(new AsyncRead(this), null);
}

Session.prototype.onOutput = function (string) {
  if (typeof(string) != "string") {
    throw "This is not a string"
  }

  try {
    var stroffset = 0;

    do {
      // Handle the case where we are writing something larger than our buffer
      var parts = (string.length > BUFFER_SIZE) ? string.slice(stroffset, stroffset + BUFFER_SIZE)
                                                : string;

      // Update our offset
      stroffset += parts.length;

      // write it
      this.outstream.writeString(parts);
    } while (stroffset < string.length);

    // Ensure the entire stream is flushed
    this.outstream.flush();
  } catch (e) {
    throw "JSBridge cannot write: " + string;
  }
};

Session.prototype.onQuit = function () {
  this.instream.close();
  this.outstream.close();
  sessions.remove(session);
};

Session.prototype.encodeOut = function (obj) {
  try {
    this.onOutput(JSON.stringify(obj));
  } catch(e) {
    if (typeof(e) == "string")
      var exception = e;
    else
      var exception = {'name': e.name,
                       'message': e.message};

    this.onOutput(JSON.stringify({'result': false,
                                  'exception':exception}));
  }
};

Session.prototype.receive = function (data) {
  Cu.evalInSandbox(data, this.sandbox);
}

var sessions = {
  _list: [],

  add: function (session) {
    this._list.push(session);
  },

  remove: function (session) {
    var index = this._list.indexOf(session);

    if(index != -1)
      this._list.splice(index, 1);
  },

  get: function (index) {
    return this._list[index];
  },

  quit: function () {
    this._list.forEach(function (session) {
      session.onQuit();
    });

    this._list.splice(0, this._list.length);
  }
};

function Server(port) {
  this.port = port;
}

Server.prototype.start = function () {
  try {
    this.serv = Cc['@mozilla.org/network/server-socket;1'].
                createInstance(Ci.nsIServerSocket);
    this.serv.init(this.port, true, -1);
    this.serv.asyncListen(this);
  } catch (e) {
    log('jsbridge: Exception: ' + e);
  }
}

Server.prototype.stop = function () {
  this.serv.close();
  this.sessions.quit();
  this.serv = undefined;

  // If we have file logging turned on, turn it off
  if (gJsbridgeFileLogger) {
    gJsbridgeFileLogger.close();
    gJsbridgeFileLogger = null;
  }
};

Server.prototype.onStopListening = function (serv, status) {
  // Stub function
};

Server.prototype.onSocketAccepted = function (serv, transport) {
  session = new Session(transport)
  sessions.add(session);
};

function log(msg) {
  if (DEBUG_ON)
    dump(msg + '\n');

  if (DO_FILE_LOGGING) {
    if (!gJsbridgeFileLogger) {
        // TODO
        return;
    }

    gJsbridgeFileLogger.write(msg);
 }
}

function startServer(port) {
  var server = new Server(port);
  server.start();

  return server;
}
