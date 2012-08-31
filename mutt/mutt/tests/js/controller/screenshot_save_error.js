/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const TEST_FOLDER = collector.addHttpResource('../_files/');


var setupModule = function () {
  controller = mozmill.getBrowserController();
}

/**
 * testScreenshotSaveCorruption
 * Takes a screenshot but checks against wrong dataURL
 * to imitate that the save was unsuccessful.
 */
var testScreenshotSaveCorruption = function() {
  var backButton = findElement.ID(controller.window.document, "back-button");
  var screenshotName = "screen3";

  const badDataURL = "data:image/png;base64,/ThiSISNotaReaLBase64ENCodinG";

  let screenshot = controller.screenshot(backButton, screenshotName, true, null);
  screenshot.dataURL = badDataURL;
  
  let file = Cc['@mozilla.org/file/local;1'].createInstance(Ci.nsILocalFile);
  file.initWithPath(screenshot.filename);

  check_screenshot(screenshot, screenshotName, true);
}


var check_screenshot = function (aScreenshot, aName, aIsFile) {
  expect.equal(aScreenshot.name, aName, "Name has been set correctly.");
  expect.match(aScreenshot.dataURL, "/^data:image\/.*/", "dataURL is available.");

  if (aIsFile) {
    expect.ok(aScreenshot.filename, "Filename is available.");

    let file = Cc['@mozilla.org/file/local;1'].createInstance(Ci.nsILocalFile);
    file.initWithPath(aScreenshot.filename);
    expect.ok(file.exists(), "Screenshot '" + file.path + "' has been saved.");

    let ios = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
    let fph = ios.getProtocolHandler("file").QueryInterface(Ci.nsIFileProtocolHandler);
    let savedFileSpec = fph.getURLSpecFromActualFile(file);
    log(savedFileSpec);
    let loadedDataURL = fileSpec2DataURL(savedFileSpec);
    expect.equal(aScreenshot.dataURL, loadedDataURL, "Checking saved file integrity.");

    file.remove(true);
  } else {
    expect.ok(!aScreenshot.filename, "Filename should not be set.");
  }
}

/**
 * fileSpect2DataURL
 * Converts the file from "file:///path/to/file.ext" into a dataURL string
 *
 * @param {String} aSpec 
 *        The spec where the file is located
 * @returns {String} 
 *          The dataURL, containing the base64 encoded data 
 *          (e.g. "data:image/jpeg;base64,/9j/4AA...")
 */
var fileSpec2DataURL = function(aSpec) {
  var file = brodyFile2DataURL.getFileFromURLSpec(aSpec);
  var dataURL = brodyFile2DataURL.getDataURLFromFile(file);

  return dataURL;
}


/**
 * To get a base64 encoded data uri from a local file
 *
 * @originalauthor brody at MozillaZine
 * @see http://forums.mozillazine.org/viewtopic.php?p=5091285#p5091285
 */
var brodyFile2DataURL = {
  getFileFromURLSpec: function(aURL) {
    var ios = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
    var fph = ios.getProtocolHandler("file").QueryInterface(Components.interfaces.nsIFileProtocolHandler);
    try { return fph.getFileFromURLSpec(aURL).QueryInterface(Components.interfaces.nsILocalFile); }
    catch(ex) { }
    return null;
  },
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
  asyncGetDataURLFromFile: function(aFile, aCallback) {
    Components.utils.import("resource://gre/modules/NetUtil.jsm");
    var contentType = Components.classes["@mozilla.org/mime;1"].getService(Components.interfaces.nsIMIMEService).getTypeFromFile(aFile);
    var self = this;
    NetUtil.asyncFetch(aFile, function (aInputStream, aAsyncFetchResult) {
      aCallback(self.getDataURLFromIStream(aInputStream, contentType));
    });
  },
}
