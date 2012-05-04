/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var EXPORTED_SYMBOLS = ["nsprSockets", "nsprTypes"];

const Ci = Components.interfaces;
const Cu = Components.utils;

Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/ctypes.jsm");

// Open the NSSPR library.
var nsprfile = Services.dirsvc.get("GreD", Ci.nsILocalFile);
nsprfile.append(ctypes.libraryName("nspr4"));
var lib = ctypes.open(nsprfile.path);

var nsprTypes = {
  PRFileDesc: ctypes.StructType("PRFileDesc"),

  PRNetAddr: ctypes.StructType("PRNetAddr",
                              [{'family': ctypes.uint16_t},
                               {'port': ctypes.uint16_t},
                               {'ip': ctypes.uint32_t},
                               {'pad' : ctypes.char.array(8)}]),

  PRSocketOptionData: ctypes.StructType("PRSocketOptionData",
                                        [{'option' : ctypes.int32_t},
                                         {'non_blocking': ctypes.int32_t}])
};

var nsprSockets = {
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

  PR_SetNetAddr: lib.declare("PR_SetNetAddr",
                             ctypes.default_abi,
                             ctypes.int32_t, // really doesn't return anything
                             ctypes.int32_t, // val
                             ctypes.uint16_t, // af
                             ctypes.uint16_t, // port
                             nsprTypes.PRNetAddr.ptr),

  PR_OpenTCPSocket: lib.declare("PR_OpenTCPSocket",
                                ctypes.default_abi, // cdecl calling convention
                                nsprTypes.PRFileDesc.ptr, // return (PRFileDesc*)
                                ctypes.int32_t), // first arg

  PR_SetSocketOption: lib.declare("PR_SetSocketOption",
                                  ctypes.default_abi,
                                  ctypes.int32_t,
                                  nsprTypes.PRFileDesc.ptr,
                                  nsprTypes.PRSocketOptionData.ptr),

  PR_Bind: lib.declare("PR_Bind",
                       ctypes.default_abi,
                       ctypes.int32_t,
                       nsprTypes.PRFileDesc.ptr,
                       nsprTypes.PRNetAddr.ptr),

  PR_Listen: lib.declare("PR_Listen",
                          ctypes.default_abi,
                          ctypes.int32_t,
                          nsprTypes.PRFileDesc.ptr, // fd
                          ctypes.int32_t), // backlog

  PR_Accept: lib.declare("PR_Accept",
                         ctypes.default_abi,
                         nsprTypes.PRFileDesc.ptr, // new socket fd
                         nsprTypes.PRFileDesc.ptr, // rendezvous socket fd
                         nsprTypes.PRNetAddr.ptr, //addr
                         ctypes.uint32_t), // timeout interval

  PR_Close: lib.declare("PR_Close",
                        ctypes.default_abi,
                        ctypes.int32_t,
                        nsprTypes.PRFileDesc.ptr),

  PR_Recv: lib.declare("PR_Recv",
                       ctypes.default_abi,
                       ctypes.int32_t, // return
                       nsprTypes.PRFileDesc.ptr, // socket
                       ctypes.voidptr_t, // buffer
                       ctypes.int32_t, // buffer length
                       ctypes.int32_t, // must be 0, deprecated
                       ctypes.uint32_t), // timeout interval

  PR_Send: lib.declare("PR_Send",
                       ctypes.default_abi,
                       ctypes.int32_t, // return
                       nsprTypes.PRFileDesc.ptr, // socket
                       ctypes.voidptr_t, // buffer
                       ctypes.int32_t, // buffer length
                       ctypes.int32_t, // must be 0, deprecated
                       ctypes.uint32_t), // timeout interval
}
