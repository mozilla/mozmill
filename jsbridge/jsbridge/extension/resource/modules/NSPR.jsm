/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var EXPORTED_SYMBOLS = ["NSPR"];


const Ci = Components.interfaces;
const Cu = Components.utils;


// Import global JS modules
Cu.import("resource://gre/modules/ctypes.jsm");
Cu.import("resource://gre/modules/Services.jsm");


/**
 * Object to access the nspr4 library via ctypes
 */
var NSPR = {
  init: function () {
    let file = Services.dirsvc.get("GreD", Ci.nsILocalFile);
    file.append(ctypes.libraryName("nspr4"));

    // Open the NSSPR library
    NSPR._library = ctypes.open(file.path);
  }
}

NSPR.init();


NSPR.Types = {
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
  ])
}


NSPR.Sockets = {
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

  PR_SetNetAddr: NSPR._library.declare("PR_SetNetAddr",
  ctypes.default_abi,
  ctypes.int32_t, // really doesn't return anything
  ctypes.int32_t, // val
  ctypes.uint16_t, // af
  ctypes.uint16_t, // port
  NSPR.Types.PRNetAddr.ptr),

  PR_OpenTCPSocket: NSPR._library.declare("PR_OpenTCPSocket",
  ctypes.default_abi, // cdecl calling convention
  NSPR.Types.PRFileDesc.ptr, // return (PRFileDesc*)
  ctypes.int32_t), // first arg

  PR_SetSocketOption: NSPR._library.declare("PR_SetSocketOption",
  ctypes.default_abi,
  ctypes.int32_t,
  NSPR.Types.PRFileDesc.ptr,
  NSPR.Types.PRSocketOptionData.ptr),

  PR_Bind: NSPR._library.declare("PR_Bind",
  ctypes.default_abi,
  ctypes.int32_t,
  NSPR.Types.PRFileDesc.ptr,
  NSPR.Types.PRNetAddr.ptr),

  PR_Listen: NSPR._library.declare("PR_Listen",
  ctypes.default_abi,
  ctypes.int32_t,
  NSPR.Types.PRFileDesc.ptr, // fd
  ctypes.int32_t), // backlog

  PR_Accept: NSPR._library.declare("PR_Accept",
  ctypes.default_abi,
  NSPR.Types.PRFileDesc.ptr, // new socket fd
  NSPR.Types.PRFileDesc.ptr, // rendezvous socket fd
  NSPR.Types.PRNetAddr.ptr, //addr
  ctypes.uint32_t), // timeout interval

  PR_Close: NSPR._library.declare("PR_Close",
  ctypes.default_abi,
  ctypes.int32_t,
  NSPR.Types.PRFileDesc.ptr),

  PR_Recv: NSPR._library.declare("PR_Recv",
  ctypes.default_abi,
  ctypes.int32_t, // return
  NSPR.Types.PRFileDesc.ptr, // socket
  ctypes.voidptr_t, // buffer
  ctypes.int32_t, // buffer length
  ctypes.int32_t, // must be 0, deprecated
  ctypes.uint32_t), // timeout interval

  PR_Send: NSPR._library.declare("PR_Send",
  ctypes.default_abi,
  ctypes.int32_t, // return
  NSPR.Types.PRFileDesc.ptr, // socket
  ctypes.voidptr_t, // buffer
  ctypes.int32_t, // buffer length
  ctypes.int32_t, // must be 0, deprecated
  ctypes.uint32_t) // timeout interval
}
