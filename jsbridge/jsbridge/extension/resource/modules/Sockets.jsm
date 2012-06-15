/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var EXPORTED_SYMBOLS = ["Sockets"];


const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;


// Import local JS modules
Cu.import("resource://jsbridge/modules/NSPR.jsm");


// Services.appShell is not defined for Firefox 10 ESR
var gAppShell = Cc["@mozilla.org/appshell/appShellService;1"]
                .getService(Ci.nsIAppShellService)


var Sockets = { };


Sockets.Client = function (fd) {
  this.fd = fd;
};

Sockets.Client.prototype = {
  onMessage: function (callback, interval, bufsize) {
    bufsize = bufsize || 4096;
    interval = interval || 100;
    var self = this;

    (function getMessage() {
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

      gAppShell.hiddenDOMWindow.setTimeout(getMessage, interval);
    })();
  },

  onDisconnect: function (callback) {
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
};

Sockets.ServerSocket.prototype = {
  onConnect: function (callback, interval) {
    interval = interval || 300;
    let self = this;

    (function accept() {
      var newfd = NSPR.Sockets.PR_Accept(self.fd, self.addr.address(),
                                         NSPR.Sockets.PR_INTERVAL_NO_WAIT);
      if (!newfd.isNull())
        callback(new Sockets.Client(newfd));

      gAppShell.hiddenDOMWindow.setTimeout(accept, interval);
    })();
  },

  close: function () {
    return NSPR.Sockets.PR_Close(this.fd);
  }
};
