/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

var EXPORTED_SYMBOLS = ["Server"];

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;


// Import local JS modules
Cu.import("resource://jsbridge/modules/Bridge.jsm");
Cu.import("resource://jsbridge/modules/Log.jsm");
Cu.import("resource://jsbridge/modules/Sockets.jsm");


// Reference to module which is needed for backstage access
const module = this;


var Server = { };


Server.Session = function (client) {
  this.client = client;

  var sandbox = Cu.Sandbox(module);
  sandbox.bridge = new Bridge(this);

  client.onMessage(function (data) {
    data = toUnicode(data, "utf-8");
    Cu.evalInSandbox(data, sandbox);
  });
}

Server.Session.prototype.send = function (string) {
  if (typeof(string) != "string")
    throw "jsbridge can only send strings";

  if (this.client) {
    this.client.sendMessage(toUnicode(string, 'utf-8'));
  } else {
    Log.dump("Attempting to send message after session closed", string);
  }
};

Server.Session.prototype.quit = function () {
  this.client.close();
  this.client = null;
};

Server.Session.prototype.encodeOut = function (obj) {
  try {
    this.send(JSON.stringify(obj));
  } catch (e) {
    if (typeof(e) == "string")
      var exception = e;
    else
      var exception = {'name': e.name,
                       'message': e.message};

    this.send(JSON.stringify({'result': false,
                              'exception': exception}));
  }
};

/**
 *
 * @param port
 * @constructor
 */
Server.Server = function (port) {
  this._port = port;
  this._socket = new Sockets.ServerSocket(this._port);
}

Server.Server.prototype = {
  start: function () {
    Log.dump("Start JSBridge server on port", this._port);

    this._socket.onConnect(function (client) {
      sessions.add(new Server.Session(client));
    });
  },

  stop: function () {
    Log.dump("Stop JSBridge server on port", this._port);

    sessions.quit();

    this._socket.close();
    this._socket = null;
  }
};


var sessions = {
  _list: [],

  add: function (session) {
    this._list.push(session);
  },

  remove: function (session) {
    var index = this._list.indexOf(session);
    if (index != -1) {
      return this._list.splice(index, 1);
    }

    return null;
  },

  get: function (index) {
    return this._list[index];
  },

  quit: function () {
    this._list.forEach(function (session) {
      session.quit();
    });

    this._list.splice(0, this._list.length);
  }
};


var toUnicode = function (text, charset) {
  let converter = Cc["@mozilla.org/intl/scriptableunicodeconverter"].
    createInstance(Ci.nsIScriptableUnicodeConverter);
  converter.charset = charset;
  text = converter.ConvertToUnicode(text);

  return text;
}
