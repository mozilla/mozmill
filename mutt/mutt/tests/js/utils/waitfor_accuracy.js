/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
 
function testWaitForTimeoutAccuracy() {
  const wfMessage = "Throws TimeoutError";
  const wfTimeout = 5000;
  const wfInterval = 100;

  const innerLoopSleepTime = 500;

  const expectedElaspedTime = wfTimeout + wfInterval + innerLoopSleepTime;
  const maxAllowedDifference = Math.max(2000, (innerLoopSleepTime * 2) + wfInterval);

  var controller = mozmill.getBrowserController();

  var date = new Date();
  var time = date.getTime();

  dump("start time: " + time + "\n");

  var counter = 1;

  try {
    expect.throws(function () {
      controller.waitFor(function () {
        date = new Date();
        dump("iteration: " + counter + ", time elapsed = " + (date.getTime() - time) + "\n");
        counter++;
        controller.sleep(innerLoopSleepTime);
        return false;
      }, wfMessage, wfTimeout, wfInterval);
    }, "TimeoutError", "waitFor() should have run into a timeout.");
  }
  finally {
    date = new Date();
    var endTime = date.getTime();
    var elaspedTime = endTime - time;
    var difference = Math.abs(expectedElaspedTime - elaspedTime);
    dump("end time: " + endTime + "\n");
    dump("final time elapsed: " + elaspedTime + "\n");
    dump("difference: " + difference + "ms\n");
  }

  

  expect.equal(
    (difference <= maxAllowedDifference), true, 
    "waitFor's timeout accuracy should be in " + maxAllowedDifference + "ms" +
      ", currently: " + difference + "ms"
  );
}
