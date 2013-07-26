/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

var utils = {}; Cu.import('resource://mozmill/stdlib/utils.js', utils);

const TEST_DATA = "data:image/jpeg;base64," +
  "iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFAQMAAAC3obSmAAAACXBIWXMAAA7DAAAOwwHH" +
  "b6hkAAAABlBMVEX///8AAABVwtN+AAAAF0lEQVR4XgXAgQwAAAACsCOGEkbYDcH0BEIB" +
  "SflcthkAAAAASUVORK5CYII=";

const NAME = "smile5x5";

var setupModule = function (aModule) {
  aModule.controller = mozmill.getBrowserController();
}

/**
 * testScreenshotSaveCorruption
 * Saves a dataURL and reads back the saved file.
 */
var testScreenshotSaveCorruption = function() {

  // Save dataURL to disk
  var {filename, failure} = utils.saveDataURL(TEST_DATA, NAME);

  expect.ok(!failure, "No failure while saving dataURL.");

  expect.ok(filename, "Filename is available.");

  // Try to read back the saved dataURL
  var file = Cc['@mozilla.org/file/local;1'].createInstance(Ci.nsILocalFile);
  file.initWithPath(filename);
  assert.ok(file.exists(), "File '" + file.path + "' exists.");

  var loadedDataURL = brodyFile2DataURL.getDataURLFromFile(file);
  expect.equal(TEST_DATA, loadedDataURL, "DataURL has been saved correctly.");

  file.remove(true);
}


/**
 * To get a base64 encoded data uri from a local file
 *
 * @originalauthor brody at MozillaZine
 * @see http://forums.mozillazine.org/viewtopic.php?p=5091285#p5091285
 */
var brodyFile2DataURL = {
  getDataURLFromIStream: function (aInputStream, aContentType) {
    var contentType = aContentType || "application/octet-stream";

    var binaryStream = Cc["@mozilla.org/binaryinputstream;1"]
                       .createInstance(Ci.nsIBinaryInputStream);
    binaryStream.setInputStream(aInputStream);
    var encoding = controller.window.btoa(binaryStream.readBytes(binaryStream.available()));
    return "data:" + contentType + ";base64," + encoding;
  },

  getDataURLFromFile: function (aFile) {
    var contentType = Cc["@mozilla.org/mime;1"]
                      .getService(Ci.nsIMIMEService).getTypeFromFile(aFile);
    var inputStream = Cc["@mozilla.org/network/file-input-stream;1"]
                      .createInstance(Ci.nsIFileInputStream);
    inputStream.init(aFile,-1,-1,0);
    var dataURL = this.getDataURLFromIStream(inputStream, contentType);
    inputStream.close();

    return dataURL;
  },
}
