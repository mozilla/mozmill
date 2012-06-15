/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

var EXPORTED_SYMBOLS = ["Bridge"];


const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;


// Include local modules
Cu.import("resource://jsbridge/modules/Events.jsm");
Cu.import("resource://jsbridge/modules/Log.jsm");


var globalRegistry = {};
var uuidgen = Cc["@mozilla.org/uuid-generator;1"].getService(Ci.nsIUUIDGenerator);


function Bridge(session) {
  this.session = session;
  this.registry = globalRegistry;
}

Bridge.prototype._register = function (_type) {
  this.bridgeType = _type;

  if (_type === "backchannel")
    Events.addBackChannel(this);
};

Bridge.prototype.register = function (uuid, _type) {
  Log.dump("Register", uuid + " (" + _type + ")");

  try {
    this._register(_type);
    var passed = true;
  } catch (e) {
    if (typeof(e) == "string")
      var exception = e;
    else
      var exception = {'name': e.name,
                       'message': e.message};

    this.session.encodeOut({'result': false,
                            'exception': exception,
                            'uuid': uuid});
  }

  if (passed != undefined) {
    this.session.encodeOut({'result': true,
                            'eventType': 'register',
                            'uuid': uuid});
  }
};

Bridge.prototype._describe = function (obj) {
  var response = {};
  var type = (obj === null) ? "null"
                            : typeof(obj);

  if (type == "object") {
    if (obj.length != undefined)
      var type = "array";

    response.attributes = [];

    for (var i in obj) {
      response.attributes = response.attributes.concat(i);
    }
  } else if (type != "function") {
    response.data = obj;
  }

  response.type = type;

  return response;
};

Bridge.prototype.describe = function (uuid, obj) {
  Log.dump("Describe", uuid + ", " + obj);

  var response = this._describe(obj);
  response.uuid = uuid;
  response.result = true;

  this.session.encodeOut(response);
};

Bridge.prototype._set = function (obj) {
  var uuid = uuidgen.generateUUID().toString();

  this.registry[uuid] = obj;

  return uuid;
};

Bridge.prototype.set = function (uuid, obj) {
  Log.dump("Set", uuid);

  var ruuid = this._set(obj);

  this.session.encodeOut({'result': true,
                          'data': 'bridge.registry["' + ruuid + '"]',
                          'uuid': uuid});
};

Bridge.prototype._setAttribute = function (obj, name, value) {
  obj[name] = value;

  return value;
};

Bridge.prototype.setAttribute = function (uuid, obj, name, value) {
  Log.dump("Set attribute", uuid + " (" + name + "=" + value + ")");

  try {
    var result = this._setAttribute(obj, name, value);
  } catch (e) {
    if (typeof(e) == "string") {
      var exception = e;
    } else {
      var exception = {'name': e.name,
                       'message': e.message};
    }

    this.session.encodeOut({'result': false,
                            'exception': exception,
                            'uuid':uuid});
  }

  if (result != undefined) {
    this.set(uuid, obj[name]);
  }
};

Bridge.prototype._execFunction = function (func, args) {
  return func.apply(this.session.sandbox, args);
};

Bridge.prototype.execFunction = function (uuid, func, args) {
  Log.dump("Exec function", uuid + " (" + func.name + ")");

  try {
    var data = this._execFunction(func, args);
    var result = true;
  } catch (e) {
    if (typeof(e) == "string")
      var exception = e;
    else
      var exception = {'name': e.name,
                       'message': e.message};

    this.session.encodeOut({'result': false,
                            'exception': exception,
                            'uuid':uuid});
    var result = true;
  }

  if (data != undefined)
    this.set(uuid, data);
  else if (result == true)
    this.session.encodeOut({'result': true,
                            'data': null,
                            'uuid':uuid});
  else
    throw 'jsbridge could not execute function ' + func;
};

