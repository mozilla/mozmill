/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

var EXPORTED_SYMBOLS = ["Server", "Session", "sessions", "startServer"];

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

var socket = {}; Cu.import("resource://jsbridge/modules/nspr-socket.js", socket);
var bridge = {}; Cu.import("resource://jsbridge/modules/bridge.js", bridge);

var hwindow = Cc["@mozilla.org/appshell/appShellService;1"].
              getService(Ci.nsIAppShellService).hiddenDOMWindow;

backstage = this;

function Session(client) {
  this.client = client;

  var sandbox = Cu.Sandbox(backstage);
  sandbox.bridge = new bridge.Bridge(this);
  sandbox.openPreferences = hwindow.openPreferences;

  client.onMessage(function (data) {
    data = toUnicode(data, "utf-8");
    Cu.evalInSandbox(data, sandbox);
  });
}

Session.prototype.send = function (string) {
  if (typeof(string) != "string")
    throw "jsbridge can only send strings";

  this.client.sendMessage(toUnicode(string, 'utf-8'));
};

Session.prototype.quit = function () {
  this.client.close();
};

Session.prototype.encodeOut = function (obj) {
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

var sessions = {
  _list: [],

  add: function (session) {
    this._list.push(session);
  },

  remove: function (session) {
    var index = this._list.indexOf(session);
    if (index != -1)
      this._list.splice(index, 1);
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

var Server = function (port) {
  this.server = new socket.ServerSocket(port);
}

Server.prototype.start = function () {
  this.server.onConnect(function (client) {
    sessions.add(new Session(client));
  });
};

Server.prototype.stop = function () {
  this.server.close();
  sessions.quit();
  this.server = undefined;
};

function startServer(port) {
  var server = new Server(port);
  server.start();

  return server;
}

var toUnicode = function (text, charset) {
  var converter = Cc["@mozilla.org/intl/scriptableunicodeconverter"].
                  createInstance(Ci.nsIScriptableUnicodeConverter);
  converter.charset = charset;
  text = converter.ConvertToUnicode(text);

  return text;
}
