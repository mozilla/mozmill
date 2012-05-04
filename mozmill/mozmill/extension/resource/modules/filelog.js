/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is MozMill Test code.
 *
 * The Initial Developer of the Original Code is the Mozilla Foundation.
 * Portions created by the Initial Developer are Copyright (C) 2011
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Clint Talbert <ctalbert@mozilla.com> (Original Author)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

var EXPORTED_SYMBOLS = ["JsbridgeFileLogger"];

const Cc = Components.classes;
const Ci = Components.interfaces;

var gJsbridgeFileLogger = null;

function JsbridgeFileLogger(filename) {
  this.filename = filename;
  this.init();
}

JsbridgeFileLogger.prototype = {
  _file: null,
  _fostream: null,

  init: function jsbfli() {
    this._file = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
    this._file.initWithPath(this.filename);
    this._fostream = Cc["@mozilla.org/network/file-output-stream;1"]
                    .createInstance(Ci.nsIFileOutputStream);
    // Create with PR_WRITE_ONLY(0x02), PR_CREATE_FILE(0x08), PR_APPEND(0x10)
    this._fostream.init(this._file, 0x02 | 0x08, 0664, 0);
  },

  write: function jsbflw(msg) {
    if (this._fostream) {
      var msgn = msg + "\n";
      this._fostream.write(msgn, msgn.length);
    }
  },

  close: function jsbflc() {
    if (this._fostream)
      this._fostream.close();
    this._fostream = null;
    this._file = null;
  }
};
