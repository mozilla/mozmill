/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

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
