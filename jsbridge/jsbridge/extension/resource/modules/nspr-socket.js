/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var EXPORTED_SYMBOLS = ["ServerSocket"];

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

var nspr = {}; Cu.import("resource://jsbridge/modules/nspr.js", nspr);

var nsprTypes = nspr.nsprTypes;
nspr = nspr.nsprSockets;

var hwindow = Cc["@mozilla.org/appshell/appShellService;1"].
              getService(Ci.nsIAppShellService).hiddenDOMWindow;

var ServerSocket = function (port) {
  var addr = nsprTypes.PRNetAddr();
  nspr.PR_SetNetAddr(nspr.PR_IpAddrLoopback, nspr.PR_AF_INET,
                     port, addr.address());

  var fd = nspr.PR_OpenTCPSocket(nspr.PR_AF_INET);

  // don't block for accept/send/recv
  var opt = nsprTypes.PRSocketOptionData();
  opt.non_blocking = nspr.PR_TRUE;
  opt.option = nspr.PR_SockOpt_Nonblocking;
  nspr.PR_SetSocketOption(fd, opt.address());

  // don't buffer when sending
  var opt = nsprTypes.PRSocketOptionData();
  opt.non_blocking = nspr.PR_TRUE; // same space
  opt.option = nspr.PR_SockOpt_NoDelay;
  nspr.PR_SetSocketOption(fd, opt.address());

  // allow local address re-use
  var opt = nsprTypes.PRSocketOptionData();
  opt.non_blocking = nspr.PR_TRUE; // same space
  opt.option = nspr.PR_SockOpt_Reuseaddr;
  nspr.PR_SetSocketOption(fd, opt.address());

  var status = nspr.PR_Bind(fd, addr.address());
  if (status != 0)
    throw "Socket failed to bind, kill all firefox processes";

  var status = nspr.PR_Listen(fd, -1);
  if (status != 0)
    throw "Socket failed to listen";

  this.addr = addr;
  this.fd = fd;
};

ServerSocket.prototype = {
  onConnect: function (callback, interval) {
    interval = interval || 300;
    var that = this;

    (function accept() {
      var newfd = nspr.PR_Accept(that.fd, that.addr.address(),
                                 nspr.PR_INTERVAL_NO_WAIT);
      if (!newfd.isNull())
        callback(new Client(newfd));

      hwindow.setTimeout(accept, interval);
    })();
  },

  close: function () {
    return nspr.PR_Close(this.fd);
  }
};


var Client = function (fd) {
  this.fd = fd;
};

Client.prototype = {
  onMessage: function (callback, interval, bufsize) {
    bufsize = bufsize || 4096;
    interval = interval || 100; // polling interval
    var that = this;

    (function getMessage() {
      var buffer = new nspr.buffer(bufsize);
      var bytes = nspr.PR_Recv(that.fd, buffer, bufsize, 0,
                               nspr.PR_INTERVAL_NO_WAIT);

      if (bytes > 0) {
        var message = buffer.readString();
        callback(message);
      } else if (bytes == 0) {
        if (that.handleDisconnect)
          that.handleDisconnect();

        return;
      }

      hwindow.setTimeout(getMessage, interval);
    })();
  },

  onDisconnect: function (callback) {
    this.handleDisconnect = callback;
  },

  sendMessage: function (message) {
    var buffer = new nspr.buffer(message);
    nspr.PR_Send(this.fd, buffer, message.length, 0, nspr.PR_INTERVAL_MAX);
  },

  close : function () {
    return nspr.PR_Close(this.fd);
  }
};
