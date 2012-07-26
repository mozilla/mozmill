/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var EXPORTED_SYMBOLS = ["Sockets"];


const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;


// Import local JS modules
Cu.import("resource://jsbridge/modules/NSPR.jsm");


var Sockets = { };


Sockets.Client = function (fd) {
  this.fd = fd;
  this.timer = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);
};

Sockets.Client.prototype = {
  onMessage: function (callback, interval, bufsize) {
    bufsize = bufsize || 4096;
    interval = interval || 100;
    var self = this;

    var event = {
      notify: function (timer) {
        var buffer = new NSPR.Sockets.buffer(bufsize);
        var bytes = NSPR.Sockets.PR_Recv(self.fd, buffer, bufsize, 0,
                                         NSPR.Sockets.PR_INTERVAL_NO_WAIT);

        if (bytes > 0) {
          var message = buffer.readString();
          callback(message);

        } else if (bytes === 0) {
          if (self.handleDisconnect)
            self.handleDisconnect();

          return;
        }

        self.timer.initWithCallback(this, interval, Ci.nsITimer.TYPE_ONE_SHOT);
      }
    };

    this.timer.initWithCallback(event, interval, Ci.nsITimer.TYPE_ONE_SHOT);
  },

  onDisconnect: function (callback) {
    this.timer.cancel();
    this.timer = null;

    this.handleDisconnect = callback;
  },

  sendMessage: function (message) {
    var buffer = new NSPR.Sockets.buffer(message);
    NSPR.Sockets.PR_Send(this.fd, buffer, message.length, 0, NSPR.Sockets.PR_INTERVAL_MAX);
  },

  close : function () {
    return NSPR.Sockets.PR_Close(this.fd);
  }
};


Sockets.ServerSocket = function (aPort) {
  let addr = NSPR.Types.PRNetAddr();
  NSPR.Sockets.PR_SetNetAddr(NSPR.Sockets.PR_IpAddrLoopback,
                             NSPR.Sockets.PR_AF_INET,
                             aPort, addr.address());

  let fd = NSPR.Sockets.PR_OpenTCPSocket(NSPR.Sockets.PR_AF_INET);

  // don't block for accept/send/recv
  let opt = NSPR.Types.PRSocketOptionData();
  opt.non_blocking = NSPR.Sockets.PR_TRUE;
  opt.option = NSPR.Sockets.PR_SockOpt_Nonblocking;
  NSPR.Sockets.PR_SetSocketOption(fd, opt.address());

  // don't buffer when sending
  opt = NSPR.Types.PRSocketOptionData();
  opt.non_blocking = NSPR.Sockets.PR_TRUE; // same space
  opt.option = NSPR.Sockets.PR_SockOpt_NoDelay;
  NSPR.Sockets.PR_SetSocketOption(fd, opt.address());

  // allow local address re-use
  opt = NSPR.Types.PRSocketOptionData();
  opt.non_blocking = NSPR.Sockets.PR_TRUE; // same space
  opt.option = NSPR.Sockets.PR_SockOpt_Reuseaddr;
  NSPR.Sockets.PR_SetSocketOption(fd, opt.address());

  let status = NSPR.Sockets.PR_Bind(fd, addr.address());
  if (status !== 0)
    throw Error("Socket failed to bind, kill all firefox processes");

  status = NSPR.Sockets.PR_Listen(fd, -1);
  if (status !== 0)
    throw Error("Socket failed to listen");

  this.addr = addr;
  this.fd = fd;

  this.timer = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);
};

Sockets.ServerSocket.prototype = {
  onConnect: function (callback, interval) {
    interval = interval || 300;
    let self = this;

    var event = {
      notify: function (timer) {
        let newfd = NSPR.Sockets.PR_Accept(self.fd, self.addr.address(),
                                           NSPR.Sockets.PR_INTERVAL_NO_WAIT);
        if (!newfd.isNull()) {
          callback(new Sockets.Client(newfd));
        }
      }
    };

    this.timer.initWithCallback(event, interval, Ci.nsITimer.TYPE_REPEATING_SLACK);
  },

  close: function () {
    this.timer.cancel();
    this.timer = null;

    return NSPR.Sockets.PR_Close(this.fd);
  }
};
