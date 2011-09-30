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
 *   Henrik Skupin <mail@hskupin.info> (Original Author)
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

/**
 * @namespace Defines utility methods for handling stack frames
 */
var stack = exports;


/**
 * Find the frame to use for logging the test result. If a start frame has
 * been specified, we walk down the stack until a frame with the same filename
 * as the start frame has been found. The next file in the stack will be the
 * frame to use for logging the result.
 *
 * @memberOf stack
 * @param {Object} [aStartFrame=Components.stack] Frame to start from walking up the stack.
 * @returns {Object} Frame of the stack to use for logging the result.
 */
function findCallerFrame(aStartFrame) {
  let frame = Components.stack;
  let filename = frame.filename.replace(/(.*)-> /, "");

  // If a start frame has been specified, walk up the stack until we have
  // found the corresponding file
  if (aStartFrame) {
    filename = aStartFrame.filename.replace(/(.*)-> /, "");

    while (frame.caller &&
           frame.filename && (frame.filename.indexOf(filename) == -1)) {
      frame = frame.caller;
    }
  }

  // Walk even up more until the next file has been found
  while (frame.caller &&
         (!frame.filename || (frame.filename.indexOf(filename) != -1)))
    frame = frame.caller;

  return frame;
}

// Export of functions
stack.findCallerFrame = findCallerFrame;
