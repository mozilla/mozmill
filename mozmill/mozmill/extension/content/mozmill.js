/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var utils = {}; Components.utils.import('resource://mozmill/stdlib/utils.js', utils);

var updateOutput = function(){
  //get the checkboxes
  var pass = document.getElementById('outPass');
  var fail = document.getElementById('outFail');
  var info = document.getElementById('outTest');

  //get the collections
  var passCollect = window.document.getElementsByClassName('pass');
  var failCollect = window.document.getElementsByClassName('fail');
  var infoCollect = window.document.getElementsByClassName('test');
  
  //set the htmlcollection display property in accordance item.checked
  var setDisplay = function(item, collection){
    for (var i = 0; i < collection.length; i++){
      if (item.checked == true){
        collection[i].style.display = "block";
      } else {
        collection[i].style.display = "none";
      }
    }
  };
  
  setDisplay(pass, passCollect);
  setDisplay(fail, failCollect);
  setDisplay(info, infoCollect);
};

function cleanUp(){
  //cleanup frame event listeners for output
  removeStateListeners();
  // Just store width and height
  utils.setPreference("mozmill.screenX", window.screenX);
  utils.setPreference("mozmill.screenY", window.screenY);
  utils.setPreference("mozmill.width", window.document.documentElement.clientWidth);
  utils.setPreference("mozmill.height", window.document.documentElement.clientHeight);
}
