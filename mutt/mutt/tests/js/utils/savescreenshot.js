/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var utils = {};


var setupModule = function () {
  Cu.import('resource://mozmill/stdlib/utils.js', utils); 
}

/**
 * testScreenshotSaveCorruption
 * Saves a dataURL and reads back the saved file.
 */
var testScreenshotSaveCorruption = function() {
  const name = "smile5x5";

  const smile5x5DataURL = "data:image/jpeg;base64," + 
    "iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFAQMAAAC3obSmAAAACXBIWXMAAA7DAAAOwwHHb6hkAAAA" +
    "BlBMVEX///8AAABVwtN+AAAAF0lEQVR4XgXAgQwAAAACsCOGEkbYDcH0BEIBSflcthkAAAAASUVORK5CYII=";

  // Save the screenshot to disk
  var ready = false;
  var failure = false;

  function sync(aResult) {
    if (!Components.isSuccessCode(aResult))
      failure = true;
    ready = true;
  }

  // Save screenshot to disk and wait for ansynchronous action to be completed
  var filename = utils.saveScreenshot(smile5x5DataURL, name, sync);
  utils.waitFor(function () {
    return ready;
  }, "Screenshot '" + filename + "' has been saved.");

  expect.ok(!failure, "No failure while saving dataURL.");

  expect.ok(filename, "Filename is available.");

  // Try to read back the saved dataURL
  var file = Cc['@mozilla.org/file/local;1'].createInstance(Ci.nsILocalFile);
  file.initWithPath(filename);
  expect.ok(file.exists(), "DataURL '" + file.path + "' has been saved.");

  var loadedDataURL = brodyFile2DataURL.getDataURLFromFile(file);
  expect.equal(smile5x5DataURL, loadedDataURL, "DataURL has been saved correctly.");

  file.remove(true);
}


/**
 * To get a base64 encoded data uri from a local file
 *
 * @originalauthor brody at MozillaZine
 * @see http://forums.mozillazine.org/viewtopic.php?p=5091285#p5091285
 */
var brodyFile2DataURL = {
  getDataURLFromIStream: function(aInputStream, aContentType) {
    var contentType = aContentType || "application/octet-stream";

    var binaryStream = Components.classes["@mozilla.org/binaryinputstream;1"].createInstance(Components.interfaces.nsIBinaryInputStream);
    binaryStream.setInputStream(aInputStream);
    var encoding = btoa(binaryStream.readBytes(binaryStream.available()));
    return "data:" + contentType + ";base64," + encoding;
  },
  getDataURLFromFile: function(aFile) {
    var contentType = Components.classes["@mozilla.org/mime;1"].getService(Components.interfaces.nsIMIMEService).getTypeFromFile(aFile);
    var inputStream = Components.classes["@mozilla.org/network/file-input-stream;1"].createInstance(Components.interfaces.nsIFileInputStream);
    inputStream.init(aFile,-1,-1,0);
    var dataURL = this.getDataURLFromIStream(inputStream, contentType);
    inputStream.close();
    
    return dataURL;
  },
}
