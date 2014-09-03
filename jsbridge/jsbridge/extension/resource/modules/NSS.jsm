/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

var EXPORTED_SYMBOLS = ["NSS"];


const Ci = Components.interfaces;
const Cu = Components.utils;


// Import global JS modules
Cu.import("resource://gre/modules/ctypes.jsm");
Cu.import("resource://gre/modules/Services.jsm");


/**
 * Object to access the nss3 library via ctypes
 */
var NSS = {
  init: function () {
    let file = Services.dirsvc.get("XREExeF", Ci.nsIFile);
    file.leafName = ctypes.libraryName("nspr4");

    // Even we would have to use nss3 by default, we don't do it because for
    // versions older than 22.0 nss3 already exists but doesn't offer the
    // necessary ctypes methods to us. So we try nspr4 first.
    if (!file.exists()) {
      file.leafName = ctypes.libraryName("nss3");
    }

    // Open the NSS library
    NSS._library = ctypes.open(file.path);
  }
}

NSS.init();


NSS.Types = {
  // Return codes
  PR_FAILURE: -1,
  PR_SUCCESS: 0,

  // Error codes
  // See http://mxr.mozilla.org/mozilla-central/source/nsprpub/pr/include/prerr.h
  PR_WOULD_BLOCK_ERROR: -5998,

  PRErrorCode: ctypes.int32_t,

  PRFileDesc: ctypes.StructType("PRFileDesc"),

  PRNetAddr: ctypes.StructType("PRNetAddr", [
    {'family': ctypes.uint16_t},
    {'port': ctypes.uint16_t},
    {'ip': ctypes.uint32_t},
    {'pad' : ctypes.char.array(8)}
  ]),

  PRSocketOptionData: ctypes.StructType("PRSocketOptionData", [
    {'option' : ctypes.int32_t},
    {'non_blocking': ctypes.int32_t}
  ]),

  PRStatus: ctypes.int32_t
}


NSS.Sockets = {
  PR_TRUE: 1,
  PR_AF_INET: 2,
  PR_IpAddrAny: 1,
  PR_IpAddrLoopback: 2,
  PR_SockOpt_Nonblocking: 0,
  PR_SockOpt_Reuseaddr: 2,
  PR_SockOpt_NoDelay: 13,
  PR_INTERVAL_NO_WAIT: 0,
  PR_INTERVAL_MAX: 100000,

  buffer: ctypes.ArrayType(ctypes.char),

  PR_Accept: NSS._library.declare("PR_Accept",
    ctypes.default_abi,
    NSS.Types.PRFileDesc.ptr, // new socket
    NSS.Types.PRFileDesc.ptr, // rendezvous socket
    NSS.Types.PRNetAddr.ptr, // address
    ctypes.uint32_t // timeout interval
  ),

  PR_Bind: NSS._library.declare("PR_Bind",
    ctypes.default_abi,
    NSS.Types.PRStatus,  // return (status)
    NSS.Types.PRFileDesc.ptr,  // socket
    NSS.Types.PRNetAddr.ptr  // address
  ),

  PR_Close: NSS._library.declare("PR_Close",
    ctypes.default_abi,
    NSS.Types.PRStatus,  // return (status)
    NSS.Types.PRFileDesc.ptr  // socket
  ),

  PR_GetError: NSS._library.declare("PR_GetError",
    ctypes.default_abi,
    NSS.Types.PRErrorCode // return
  ),

  PR_Listen: NSS._library.declare("PR_Listen",
    ctypes.default_abi,
    NSS.Types.PRStatus,  // return (status)
    NSS.Types.PRFileDesc.ptr, // socket
    ctypes.int32_t // backlog
  ),

  PR_OpenTCPSocket: NSS._library.declare("PR_OpenTCPSocket",
    ctypes.default_abi, // cdecl calling convention
    NSS.Types.PRFileDesc.ptr, // return (socket)
    ctypes.int32_t            // address family
  ),

  PR_Recv: NSS._library.declare("PR_Recv",
    ctypes.default_abi,
    NSS.Types.PRStatus, // return (status)
    NSS.Types.PRFileDesc.ptr, // socket
    ctypes.voidptr_t, // buffer
    ctypes.int32_t, // buffer length
    ctypes.int32_t, // must be 0, deprecated
    ctypes.uint32_t // timeout interval
  ),

  PR_Send: NSS._library.declare("PR_Send",
    ctypes.default_abi,
    NSS.Types.PRStatus, // return (status)
    NSS.Types.PRFileDesc.ptr, // socket
    ctypes.voidptr_t, // buffer
    ctypes.int32_t, // buffer length
    ctypes.int32_t, // must be 0, deprecated
    ctypes.uint32_t // timeout interval
  ),

  PR_SetNetAddr: NSS._library.declare("PR_SetNetAddr",
    ctypes.default_abi,
    NSS.Types.PRStatus, // return (status)
    ctypes.int32_t,  // host
    ctypes.uint16_t, // address family
    ctypes.uint16_t, // port
    NSS.Types.PRNetAddr.ptr
  ),

  PR_SetSocketOption: NSS._library.declare("PR_SetSocketOption",
    ctypes.default_abi,
    NSS.Types.PRStatus,  // return (status)
    NSS.Types.PRFileDesc.ptr, // socket
    NSS.Types.PRSocketOptionData.ptr // option data
  )
}
